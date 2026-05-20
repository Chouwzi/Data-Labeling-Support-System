package com.uth.datalabeling.modules.annotation.service;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import com.uth.datalabeling.modules.annotation.dto.request.AnnotationItemRequest;
import com.uth.datalabeling.modules.annotation.dto.request.SaveAnnotationsRequest;
import com.uth.datalabeling.modules.annotation.dto.response.AnnotationResponse;
import com.uth.datalabeling.modules.annotation.entity.Annotation;
import com.uth.datalabeling.modules.annotation.entity.AnnotationShapeType;
import com.uth.datalabeling.modules.annotation.repository.AnnotationRepository;
import com.uth.datalabeling.modules.iam.entity.User;
import com.uth.datalabeling.modules.project.entity.Label;
import com.uth.datalabeling.modules.project.repository.LabelRepository;
import com.uth.datalabeling.modules.project.service.ProjectAccessService;
import com.uth.datalabeling.modules.task.entity.Task;
import com.uth.datalabeling.modules.task.repository.TaskRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AnnotationService {

    private static final String ROLE_ADMIN = "ADMIN";
    private static final String ROLE_ANNOTATOR = "ANNOTATOR";
    private static final String ROLE_MANAGER = "MANAGER";
    private static final String ROLE_REVIEWER = "REVIEWER";
    private static final String STATUS_ASSIGNED = "ASSIGNED";
    private static final String STATUS_IN_PROGRESS = "IN_PROGRESS";
    private static final String STATUS_PENDING = "PENDING";
    private static final String STATUS_PENDING_REVIEW = "PENDING_REVIEW";
    private static final String STATUS_READY_FOR_REVIEW = "READY_FOR_REVIEW";
    private static final String STATUS_REJECTED = "REJECTED";

    AnnotationRepository annotationRepository;
    TaskRepository taskRepository;
    LabelRepository labelRepository;
    ProjectAccessService projectAccessService;

    @Transactional(readOnly = true)
    public List<AnnotationResponse> getAnnotations(UUID taskId) {
        User currentUser = projectAccessService.getCurrentUser();
        Task task = getTask(taskId);
        validateReadAccess(task, currentUser);

        return annotationRepository.findByTaskIdOrderByCreatedAtAsc(taskId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public List<AnnotationResponse> saveAnnotations(UUID taskId, SaveAnnotationsRequest request) {
        User currentUser = projectAccessService.getCurrentUser();
        Task task = getTask(taskId);
        validateWriteAccess(task, currentUser);

        List<AnnotationItemRequest> items = request.getAnnotations() == null ? List.of() : request.getAnnotations();
        List<Annotation> annotations = items.stream()
                .map(item -> toAnnotation(task, item, currentUser))
                .toList();

        annotationRepository.deleteByTaskId(taskId);
        List<Annotation> savedAnnotations = annotations.isEmpty()
                ? List.of()
                : annotationRepository.saveAllAndFlush(annotations);

        task.setStatus(Boolean.TRUE.equals(request.getSubmit())
                ? STATUS_PENDING_REVIEW
                : (annotations.isEmpty() ? STATUS_IN_PROGRESS : STATUS_READY_FOR_REVIEW));
        taskRepository.save(task);

        return savedAnnotations.stream()
                .map(this::toResponse)
                .toList();
    }

    private Task getTask(UUID taskId) {
        return taskRepository.findById(taskId)
                .orElseThrow(() -> new AppException(ErrorCode.TASK_NOT_FOUND));
    }

    private void validateReadAccess(Task task, User currentUser) {
        if (isAdmin(currentUser) || isAssignedAnnotator(task, currentUser) || isProjectManager(task, currentUser)
                || ROLE_REVIEWER.equals(currentUser.getRole())) {
            return;
        }
        throw new AppException(ErrorCode.FORBIDDEN);
    }

    private void validateWriteAccess(Task task, User currentUser) {
        if (isAdmin(currentUser)) {
            return;
        }

        if (!ROLE_ANNOTATOR.equals(currentUser.getRole()) || !isAssignedAnnotator(task, currentUser)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        String status = task.getStatus();
        if (!STATUS_PENDING.equalsIgnoreCase(status)
                && !STATUS_ASSIGNED.equalsIgnoreCase(status)
                && !STATUS_IN_PROGRESS.equalsIgnoreCase(status)
                && !STATUS_READY_FOR_REVIEW.equalsIgnoreCase(status)
                && !STATUS_REJECTED.equalsIgnoreCase(status)) {
            throw new AppException(ErrorCode.CONFLICT, "Task is not available for annotation");
        }
    }

    private boolean isAdmin(User user) {
        return ROLE_ADMIN.equals(user.getRole());
    }

    private boolean isProjectManager(Task task, User user) {
        return ROLE_MANAGER.equals(user.getRole()) && task.getProject() != null
                && user.getId().equals(task.getProject().getManagerId());
    }

    private boolean isAssignedAnnotator(Task task, User user) {
        return task.getAnnotator() != null && user.getId().equals(task.getAnnotator().getId());
    }

    private Annotation toAnnotation(Task task, AnnotationItemRequest item, User currentUser) {
        if (item.getShapeType() != AnnotationShapeType.BOUNDING_BOX) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Unsupported annotation shape type");
        }

        Label label = labelRepository
                .findByIdAndProjectIdAndDeletedAtIsNull(item.getLabelId(), task.getProject().getId())
                .orElseThrow(() -> new AppException(ErrorCode.LABEL_NOT_FOUND));

        Map<String, Object> geometry = normalizeBoundingBox(item.getGeometry());

        return Annotation.builder()
                .task(task)
                .label(label)
                .createdBy(currentUser)
                .shapeType(item.getShapeType())
                .geometry(geometry)
                .isAiGenerated(Boolean.TRUE.equals(item.getIsAiGenerated()))
                .build();
    }

    private Map<String, Object> normalizeBoundingBox(Map<String, Object> geometry) {
        BigDecimal x = readRatio(geometry, "x", false);
        BigDecimal y = readRatio(geometry, "y", false);
        BigDecimal width = readRatio(geometry, "width", true);
        BigDecimal height = readRatio(geometry, "height", true);

        if (x.add(width).compareTo(BigDecimal.ONE) > 0 || y.add(height).compareTo(BigDecimal.ONE) > 0) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Bounding box must stay inside the image");
        }

        return Map.of(
                "x", x.doubleValue(),
                "y", y.doubleValue(),
                "width", width.doubleValue(),
                "height", height.doubleValue()
        );
    }

    private BigDecimal readRatio(Map<String, Object> geometry, String field, boolean positiveOnly) {
        Object rawValue = geometry.get(field);
        if (!(rawValue instanceof Number number)) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Bounding box " + field + " must be numeric");
        }

        BigDecimal value = new BigDecimal(number.toString());
        boolean belowMinimum = positiveOnly
                ? value.compareTo(BigDecimal.ZERO) <= 0
                : value.compareTo(BigDecimal.ZERO) < 0;
        if (belowMinimum || value.compareTo(BigDecimal.ONE) > 0) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Bounding box " + field + " must be a valid ratio");
        }
        return value;
    }

    private AnnotationResponse toResponse(Annotation annotation) {
        Label label = annotation.getLabel();
        return AnnotationResponse.builder()
                .id(annotation.getId())
                .taskId(annotation.getTask().getId())
                .shapeType(annotation.getShapeType())
                .labelId(label.getId())
                .labelName(label.getName())
                .colorHex(label.getColorHex())
                .geometry(annotation.getGeometry())
                .isAiGenerated(Boolean.TRUE.equals(annotation.getIsAiGenerated()))
                .createdAt(annotation.getCreatedAt())
                .updatedAt(annotation.getUpdatedAt())
                .build();
    }
}
