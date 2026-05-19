package com.uth.datalabeling.modules.review.service;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import com.uth.datalabeling.common.response.PageResponse;
import com.uth.datalabeling.modules.annotation.entity.Annotation;
import com.uth.datalabeling.modules.annotation.repository.AnnotationRepository;
import com.uth.datalabeling.modules.defect.entity.DefectCategory;
import com.uth.datalabeling.modules.defect.repository.DefectCategoryRepository;
import com.uth.datalabeling.modules.iam.entity.User;
import com.uth.datalabeling.modules.project.entity.Label;
import com.uth.datalabeling.modules.project.service.ProjectAccessService;
import com.uth.datalabeling.modules.review.dto.request.RejectImageRequest;
import com.uth.datalabeling.modules.review.dto.response.ReviewQueueAnnotationResponse;
import com.uth.datalabeling.modules.review.dto.response.ReviewQueueImageResponse;
import com.uth.datalabeling.modules.review.dto.response.ReviewStatsResponse;
import com.uth.datalabeling.modules.review.entity.Review;
import com.uth.datalabeling.modules.review.repository.ReviewRepository;
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
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ReviewQueueService {

    private static final String STATUS_PENDING_REVIEW = "PENDING_REVIEW";
    private static final String ACTION_APPROVED = "APPROVED";
    private static final String ACTION_REJECTED = "REJECTED";

    ProjectAccessService projectAccessService;
    TaskRepository taskRepository;
    AnnotationRepository annotationRepository;
    ReviewRepository reviewRepository;
    DefectCategoryRepository defectCategoryRepository;

    @Transactional(readOnly = true)
    public PageResponse<ReviewQueueImageResponse> getPendingReviewImages(UUID projectId, Pageable pageable) {
        UUID managerId = resolveManagerFilter(projectId);
        UUID reviewerScopeId = resolveReviewerScopeFilter(projectId);
        Page<Task> taskPage = reviewerScopeId == null
                ? taskRepository.findReviewQueueImages(projectId, managerId, STATUS_PENDING_REVIEW, pageable)
                : taskRepository.findReviewQueueImages(projectId, managerId, reviewerScopeId, STATUS_PENDING_REVIEW, pageable);
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

    @Transactional(readOnly = true)
    public PageResponse<ReviewQueueImageResponse> getCompletedReviewImages(
            UUID projectId,
            String status,
            UUID annotatorId,
            Pageable pageable) {
        UUID managerId = resolveManagerFilter(projectId);
        String normalizedStatus = normalizeReviewAction(status);
        Page<Review> reviewPage = reviewRepository.findReviewHistory(
                projectId,
                managerId,
                resolveReviewerScopeFilter(projectId),
                normalizedStatus,
                annotatorId,
                pageable);
        List<Task> tasks = reviewPage.getContent().stream()
                .map(Review::getTask)
                .toList();
        Map<UUID, List<Annotation>> annotationsByTaskId = loadAnnotationsByTaskId(tasks);

        return PageResponse.<ReviewQueueImageResponse>builder()
                .currentPage(reviewPage.getNumber())
                .totalPages(reviewPage.getTotalPages())
                .pageSize(reviewPage.getSize())
                .totalElements(reviewPage.getTotalElements())
                .data(reviewPage.getContent().stream()
                        .map(review -> toReviewHistoryResponse(
                                review,
                                annotationsByTaskId.getOrDefault(review.getTask().getId(), List.of())))
                        .toList())
                .build();
    }

    @Transactional(readOnly = true)
    public ReviewStatsResponse getReviewStats(UUID projectId, String range) {
        UUID managerId = resolveManagerFilter(projectId);
        UUID reviewerScopeId = resolveReviewerScopeFilter(projectId);
        LocalDateTime from = resolveRangeStart(range);
        long pendingReview = reviewerScopeId == null
                ? taskRepository.countReviewQueueImages(projectId, managerId, STATUS_PENDING_REVIEW)
                : taskRepository.countReviewQueueImages(projectId, managerId, reviewerScopeId, STATUS_PENDING_REVIEW);
        long approved = reviewRepository.countByActionSince(projectId, managerId, reviewerScopeId, ACTION_APPROVED, from);
        long rejected = reviewRepository.countByActionSince(projectId, managerId, reviewerScopeId, ACTION_REJECTED, from);
        long totalReviewed = reviewRepository.countReviewedSince(projectId, managerId, reviewerScopeId, from);

        return ReviewStatsResponse.builder()
                .pendingReview(pendingReview)
                .approved(approved)
                .rejected(rejected)
                .totalReviewed(totalReviewed)
                .approvalRate(totalReviewed > 0 ? roundPercent(approved, totalReviewed) : 0.0)
                .rejectionRate(totalReviewed > 0 ? roundPercent(rejected, totalReviewed) : 0.0)
                .averageReviewTimeSeconds(null)
                .build();
    }

    @Transactional
    public void rejectImage(UUID taskId, RejectImageRequest request) {
        User reviewer = projectAccessService.getCurrentUser();
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new AppException(ErrorCode.TASK_NOT_FOUND));

        if (!STATUS_PENDING_REVIEW.equals(task.getStatus())) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Task is not in PENDING_REVIEW status");
        }

        projectAccessService.findProjectAndCheckReadAccess(task.getProject().getId());

        DefectCategory defectCategory = null;
        if (request.getDefectCategoryId() != null) {
            defectCategory = defectCategoryRepository.findById(request.getDefectCategoryId())
                    .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Defect category not found"));
        }

        Review review = Review.builder()
                .task(task)
                .reviewer(reviewer)
                .defectCategory(defectCategory)
                .comments(request.getComments())
                .action(ACTION_REJECTED)
                .build();
        reviewRepository.save(review);

        task.setStatus("REJECTED");
        taskRepository.save(task);
    }

    @Transactional
    public void approveImage(UUID taskId) {
        User reviewer = projectAccessService.getCurrentUser();
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new AppException(ErrorCode.TASK_NOT_FOUND));

        if (!STATUS_PENDING_REVIEW.equals(task.getStatus())) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Task is not in PENDING_REVIEW status");
        }

        projectAccessService.findProjectAndCheckReadAccess(task.getProject().getId());

        Review review = Review.builder()
                .task(task)
                .reviewer(reviewer)
                .defectCategory(null)
                .comments("Approved by reviewer")
                .action(ACTION_APPROVED)
                .build();
        reviewRepository.save(review);

        task.setStatus("COMPLETED");
        taskRepository.save(task);
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

    private ReviewQueueImageResponse toReviewHistoryResponse(Review review, List<Annotation> taskAnnotations) {
        Task task = review.getTask();
        User annotator = task.getAnnotator();
        User reviewer = review.getReviewer();
        DefectCategory defectCategory = review.getDefectCategory();
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
                .reviewerId(reviewer != null ? reviewer.getId() : null)
                .reviewerName(reviewer != null ? reviewer.getFullName() : null)
                .submittedAt(task.getUpdatedAt() != null ? task.getUpdatedAt() : task.getCreatedAt())
                .reviewedAt(review.getCreatedAt())
                .defectCategoryId(defectCategory != null ? defectCategory.getId() : null)
                .defectCategoryName(defectCategory != null ? defectCategory.getName() : null)
                .comments(review.getComments())
                .reviewAction(review.getAction())
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

    private UUID resolveManagerFilter(UUID projectId) {
        User currentUser = projectAccessService.getCurrentUser();
        if (projectId != null) {
            projectAccessService.findProjectAndCheckReadAccess(projectId);
            return null;
        }
        return "MANAGER".equals(currentUser.getRole()) ? currentUser.getId() : null;
    }

    private UUID resolveReviewerScopeFilter(UUID projectId) {
        User currentUser = projectAccessService.getCurrentUser();
        return projectId == null && "REVIEWER".equals(currentUser.getRole()) ? currentUser.getId() : null;
    }

    private String normalizeReviewAction(String status) {
        if (status == null || status.trim().isEmpty() || "ALL".equalsIgnoreCase(status.trim())) {
            return null;
        }
        String normalized = status.trim().toUpperCase();
        if ("COMPLETED".equals(normalized)) {
            return ACTION_APPROVED;
        }
        if (!ACTION_APPROVED.equals(normalized) && !ACTION_REJECTED.equals(normalized)) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Review status is invalid");
        }
        return normalized;
    }

    private LocalDateTime resolveRangeStart(String range) {
        if (range == null || range.isBlank() || "today".equalsIgnoreCase(range)) {
            return LocalDateTime.now().with(LocalTime.MIN);
        }
        return switch (range.trim().toLowerCase()) {
            case "7d" -> LocalDateTime.now().minusDays(7);
            case "30d" -> LocalDateTime.now().minusDays(30);
            case "all" -> LocalDateTime.of(1970, 1, 1, 0, 0);
            default -> throw new AppException(ErrorCode.VALIDATION_ERROR, "Review stats range is invalid");
        };
    }

    private double roundPercent(long value, long total) {
        return Math.round(((double) value / (double) total) * 10000.0) / 100.0;
    }
}
