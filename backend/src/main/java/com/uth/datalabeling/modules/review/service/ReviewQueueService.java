package com.uth.datalabeling.modules.review.service;

import com.uth.datalabeling.common.response.PageResponse;
import com.uth.datalabeling.modules.annotation.entity.Annotation;
import com.uth.datalabeling.modules.annotation.repository.AnnotationRepository;
import com.uth.datalabeling.modules.iam.entity.User;
import com.uth.datalabeling.modules.project.entity.Label;
import com.uth.datalabeling.modules.review.dto.response.ReviewQueueAnnotationResponse;
import com.uth.datalabeling.modules.review.dto.response.ReviewQueueImageResponse;
import com.uth.datalabeling.modules.project.service.ProjectAccessService;
import com.uth.datalabeling.modules.task.entity.Task;
import com.uth.datalabeling.modules.task.repository.TaskRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ReviewQueueService {

    private static final String STATUS_PENDING_REVIEW = "PENDING_REVIEW";

    ProjectAccessService projectAccessService;
    TaskRepository taskRepository;
    AnnotationRepository annotationRepository;

    @Transactional(readOnly = true)
    public PageResponse<ReviewQueueImageResponse> getPendingReviewImages(UUID projectId, Pageable pageable) {
        User currentUser = projectAccessService.getCurrentUser();
        UUID managerId = null;

        if (projectId != null) {
            projectAccessService.findProjectAndCheckReadAccess(projectId);
        } else {
            if ("MANAGER".equals(currentUser.getRole())) {
                managerId = currentUser.getId();
            }
        }

        Page<Task> taskPage = taskRepository.findReviewQueueImages(projectId, managerId, STATUS_PENDING_REVIEW, pageable);
        List<Task> tasks = taskPage.getContent();
        Map<UUID, List<Annotation>> annotationsByTaskId = loadAnnotationsByTaskId(tasks);

        return PageResponse.<ReviewQueueImageResponse>builder()
                .currentPage(taskPage.getNumber())
                .totalPages(taskPage.getTotalPages())
                .pageSize(taskPage.getSize())
                .totalElements(taskPage.getTotalElements())
                .data(tasks.stream()
                        .map(task -> toReviewQueueImageResponse(
                                task,
                                annotationsByTaskId.getOrDefault(task.getId(), List.of())))
                        .toList())
                .build();
    }

    private Map<UUID, List<Annotation>> loadAnnotationsByTaskId(List<Task> tasks) {
        if (tasks.isEmpty()) {
            return Map.of();
        }

        List<UUID> taskIds = tasks.stream()
                .map(Task::getId)
                .toList();

        return annotationRepository.findByTaskIdInOrderByTaskIdAscCreatedAtAsc(taskIds).stream()
                .collect(Collectors.groupingBy(annotation -> annotation.getTask().getId()));
    }

    private ReviewQueueImageResponse toReviewQueueImageResponse(Task task, List<Annotation> taskAnnotations) {
        User annotator = task.getAnnotator();
        LocalDateTime submittedAt = task.getUpdatedAt() != null ? task.getUpdatedAt() : task.getCreatedAt();
        List<ReviewQueueAnnotationResponse> annotations = taskAnnotations.stream()
                .map(this::toAnnotationResponse)
                .toList();

        return ReviewQueueImageResponse.builder()
                .taskId(task.getId())
                .projectId(task.getProject().getId())
                .projectName(task.getProject().getName())
                .sampleId(task.getSample().getId())
                .imageUrl(task.getSample().getImageUrl())
                .status(task.getStatus())
                .annotatorId(annotator != null ? annotator.getId() : null)
                .annotatorName(annotator != null ? annotator.getFullName() : null)
                .submittedAt(submittedAt)
                .annotations(annotations)
                .build();
    }

    private ReviewQueueAnnotationResponse toAnnotationResponse(Annotation annotation) {
        Label label = annotation.getLabel();
        return ReviewQueueAnnotationResponse.builder()
                .id(annotation.getId())
                .labelId(label.getId())
                .labelName(label.getName())
                .colorHex(label.getColorHex())
                .shapeType(annotation.getShapeType().name())
                .geometry(annotation.getGeometry())
                .isAiGenerated(Boolean.TRUE.equals(annotation.getIsAiGenerated()))
                .build();
    }
}
