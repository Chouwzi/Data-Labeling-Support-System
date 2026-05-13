package com.uth.datalabeling.modules.annotation.service;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import com.uth.datalabeling.modules.annotation.dto.request.AnnotationSubmitRequest;
import com.uth.datalabeling.modules.annotation.dto.response.AnnotationResponse;
import com.uth.datalabeling.modules.annotation.entity.Annotation;
import com.uth.datalabeling.modules.annotation.repository.AnnotationRepository;
import com.uth.datalabeling.modules.iam.entity.User;
import com.uth.datalabeling.modules.project.repository.LabelRepository;
import com.uth.datalabeling.modules.project.service.ProjectAccessService;
import com.uth.datalabeling.modules.task.entity.Task;
import com.uth.datalabeling.modules.task.repository.TaskRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AnnotationService {

    private static final String STATUS_ASSIGNED = "ASSIGNED";
    private static final String STATUS_IN_PROGRESS = "IN_PROGRESS";
    private static final String STATUS_SUBMITTED = "SUBMITTED";

    AnnotationRepository annotationRepository;
    TaskRepository taskRepository;
    LabelRepository labelRepository;
    ProjectAccessService projectAccessService;

    @Transactional
    public AnnotationResponse submitAnnotation(UUID taskId, AnnotationSubmitRequest request) {
        User currentUser = projectAccessService.getCurrentUser();
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new AppException(ErrorCode.TASK_NOT_FOUND));

        validateTaskOwnership(task, currentUser);
        validateTaskStatus(task);
        validateAnnotationResult(task, request.getResult());

        LocalDateTime submittedAt = LocalDateTime.now();
        Annotation annotation = Annotation.builder()
                .task(task)
                .annotator(currentUser)
                .result(request.getResult())
                .leadTimeSeconds(request.getLeadTimeSeconds())
                .status(STATUS_SUBMITTED)
                .submittedAt(submittedAt)
                .build();

        Annotation savedAnnotation = annotationRepository.save(annotation);
        task.setStatus(STATUS_SUBMITTED);
        taskRepository.save(task);

        return toResponse(savedAnnotation);
    }

    private void validateTaskOwnership(Task task, User currentUser) {
        if (task.getAnnotator() == null || !currentUser.getId().equals(task.getAnnotator().getId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
    }

    private void validateTaskStatus(Task task) {
        String status = task.getStatus();
        if (!STATUS_ASSIGNED.equalsIgnoreCase(status) && !STATUS_IN_PROGRESS.equalsIgnoreCase(status)) {
            throw new AppException(ErrorCode.CONFLICT, "Task is not available for annotation submission");
        }
    }

    private void validateAnnotationResult(Task task, List<Map<String, Object>> result) {
        if (result == null || result.isEmpty()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Annotation result is required");
        }

        UUID projectId = task.getProject().getId();
        for (Map<String, Object> item : result) {
            validateResultItem(item, projectId);
        }
    }

    private void validateResultItem(Map<String, Object> item, UUID projectId) {
        if (item == null || item.isEmpty()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Annotation item is required");
        }

        Object type = item.get("type");
        if (!(type instanceof String typeValue) || typeValue.trim().isEmpty()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Annotation type is required");
        }

        Object geometry = item.get("geometry");
        if (!(geometry instanceof Map<?, ?> geometryValue) || geometryValue.isEmpty()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Annotation geometry is required");
        }

        UUID labelId = extractLabelId(item.get("label_id"));
        labelRepository.findByIdAndProjectIdAndDeletedAtIsNull(labelId, projectId)
                .orElseThrow(() -> new AppException(ErrorCode.LABEL_NOT_FOUND));
    }

    private UUID extractLabelId(Object rawLabelId) {
        if (!(rawLabelId instanceof String labelIdValue) || labelIdValue.trim().isEmpty()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Annotation label_id is required");
        }

        try {
            return UUID.fromString(labelIdValue);
        } catch (IllegalArgumentException exception) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Annotation label_id is invalid");
        }
    }

    private AnnotationResponse toResponse(Annotation annotation) {
        return AnnotationResponse.builder()
                .id(annotation.getId())
                .taskId(annotation.getTask().getId())
                .annotatorId(annotation.getAnnotator().getId())
                .status(annotation.getStatus())
                .result(annotation.getResult())
                .leadTimeSeconds(annotation.getLeadTimeSeconds())
                .submittedAt(annotation.getSubmittedAt())
                .build();
    }
}
