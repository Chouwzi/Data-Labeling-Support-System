package com.uth.datalabeling.modules.review.service;

import com.uth.datalabeling.common.response.PageResponse;
import com.uth.datalabeling.modules.annotation.entity.Annotation;
import com.uth.datalabeling.modules.annotation.entity.AnnotationShapeType;
import com.uth.datalabeling.modules.annotation.repository.AnnotationRepository;
import com.uth.datalabeling.modules.dataset.entity.DataSample;
import com.uth.datalabeling.modules.iam.entity.User;
import com.uth.datalabeling.modules.project.entity.Label;
import com.uth.datalabeling.modules.project.entity.Project;
import com.uth.datalabeling.modules.project.service.ProjectAccessService;
import com.uth.datalabeling.modules.review.dto.response.ReviewQueueImageResponse;
import com.uth.datalabeling.modules.review.dto.request.RejectImageRequest;
import com.uth.datalabeling.modules.review.entity.Review;
import com.uth.datalabeling.modules.review.repository.ReviewRepository;
import com.uth.datalabeling.modules.defect.entity.DefectCategory;
import com.uth.datalabeling.modules.defect.repository.DefectCategoryRepository;
import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import com.uth.datalabeling.modules.task.entity.Task;
import com.uth.datalabeling.modules.task.repository.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.ArgumentCaptor;

@ExtendWith(MockitoExtension.class)
class ReviewQueueServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private AnnotationRepository annotationRepository;

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private DefectCategoryRepository defectCategoryRepository;

    @Mock
    private ProjectAccessService projectAccessService;

    @InjectMocks
    private ReviewQueueService reviewQueueService;

    private UUID projectId;
    private UUID taskId;
    private UUID sampleId;
    private UUID annotatorId;
    private UUID annotationId;
    private UUID labelId;
    private Task pendingReviewTask;
    private Annotation annotation;

    @BeforeEach
    void setUp() {
        projectId = UUID.randomUUID();
        taskId = UUID.randomUUID();
        sampleId = UUID.randomUUID();
        annotatorId = UUID.randomUUID();
        annotationId = UUID.randomUUID();
        labelId = UUID.randomUUID();

        Project project = Project.builder().id(projectId).name("Traffic Signs").build();
        User annotator = User.builder().id(annotatorId).fullName("Ann Labeler").email("ann@example.com").role("ANNOTATOR").build();
        DataSample sample = DataSample.builder().id(sampleId).imageUrl("uploads/traffic-001.jpg").build();
        pendingReviewTask = Task.builder()
                .id(taskId)
                .project(project)
                .sample(sample)
                .annotator(annotator)
                .status("PENDING_REVIEW")
                .updatedAt(LocalDateTime.of(2026, 5, 16, 10, 30))
                .build();

        Label label = Label.builder().id(labelId).name("Stop Sign").colorHex("#FF0000").build();
        annotation = Annotation.builder()
                .id(annotationId)
                .task(pendingReviewTask)
                .label(label)
                .shapeType(AnnotationShapeType.BOUNDING_BOX)
                .geometry(Map.of("x", 0.1, "y", 0.2, "width", 0.3, "height", 0.4))
                .isAiGenerated(false)
                .build();
    }

    @Test
    void getPendingReviewImages_ReturnsOnlyPendingReviewTasksWithAnnotations() {
        Pageable pageable = PageRequest.of(0, 10);
        when(projectAccessService.getCurrentUser()).thenReturn(User.builder().id(UUID.randomUUID()).role("REVIEWER").build());
        when(taskRepository.findReviewQueueImages(projectId, null, "PENDING_REVIEW", pageable))
                .thenReturn(new PageImpl<>(List.of(pendingReviewTask), pageable, 1));
        when(annotationRepository.findByTaskIdInOrderByTaskIdAscCreatedAtAsc(List.of(taskId)))
                .thenReturn(List.of(annotation));

        PageResponse<ReviewQueueImageResponse> response = reviewQueueService.getPendingReviewImages(projectId, pageable);

        assertEquals(0, response.getCurrentPage());
        assertEquals(1, response.getTotalPages());
        assertEquals(10, response.getPageSize());
        assertEquals(1, response.getTotalElements());
        ReviewQueueImageResponse image = response.getData().getFirst();
        assertEquals(taskId, image.getTaskId());
        assertEquals(projectId, image.getProjectId());
        assertEquals("Traffic Signs", image.getProjectName());
        assertEquals(sampleId, image.getSampleId());
        assertEquals("uploads/traffic-001.jpg", image.getImageUrl());
        assertEquals("PENDING_REVIEW", image.getStatus());
        assertEquals(annotatorId, image.getAnnotatorId());
        assertEquals("Ann Labeler", image.getAnnotatorName());
        assertEquals(LocalDateTime.of(2026, 5, 16, 10, 30), image.getSubmittedAt());
        assertEquals(1, image.getAnnotations().size());
        assertEquals(annotationId, image.getAnnotations().getFirst().getId());
        assertEquals(labelId, image.getAnnotations().getFirst().getLabelId());
        assertEquals("Stop Sign", image.getAnnotations().getFirst().getLabelName());
        assertEquals("#FF0000", image.getAnnotations().getFirst().getColorHex());
        assertEquals("BOUNDING_BOX", image.getAnnotations().getFirst().getShapeType());
        assertEquals(Map.of("x", 0.1, "y", 0.2, "width", 0.3, "height", 0.4),
                image.getAnnotations().getFirst().getGeometry());
        assertEquals(false, image.getAnnotations().getFirst().getIsAiGenerated());

        verify(projectAccessService).findProjectAndCheckReadAccess(projectId);
        verify(taskRepository).findReviewQueueImages(projectId, null, "PENDING_REVIEW", pageable);
        verify(annotationRepository).findByTaskIdInOrderByTaskIdAscCreatedAtAsc(List.of(taskId));
    }

    @Test
    void getPendingReviewImages_WithNullProjectFilterRequestsAllPendingReviewTasks() {
        Pageable pageable = PageRequest.of(2, 25);
        when(projectAccessService.getCurrentUser()).thenReturn(User.builder().id(UUID.randomUUID()).role("ADMIN").build());
        when(taskRepository.findReviewQueueImages(null, null, "PENDING_REVIEW", pageable))
                .thenReturn(new PageImpl<>(List.of(), pageable, 0));

        PageResponse<ReviewQueueImageResponse> response = reviewQueueService.getPendingReviewImages(null, pageable);

        assertEquals(2, response.getCurrentPage());
        assertEquals(25, response.getPageSize());
        assertEquals(0, response.getTotalElements());
        assertEquals(List.of(), response.getData());
        verify(taskRepository).findReviewQueueImages(null, null, "PENDING_REVIEW", pageable);
        verify(annotationRepository, never()).findByTaskIdInOrderByTaskIdAscCreatedAtAsc(List.of());
    }

    @Test
    void getPendingReviewImages_WithNullProjectFilterAndManagerRole_SetsManagerIdFilter() {
        Pageable pageable = PageRequest.of(0, 10);
        UUID currentManagerId = UUID.randomUUID();
        when(projectAccessService.getCurrentUser()).thenReturn(User.builder().id(currentManagerId).role("MANAGER").build());
        when(taskRepository.findReviewQueueImages(null, currentManagerId, "PENDING_REVIEW", pageable))
                .thenReturn(new PageImpl<>(List.of(), pageable, 0));

        PageResponse<ReviewQueueImageResponse> response = reviewQueueService.getPendingReviewImages(null, pageable);

        assertEquals(0, response.getTotalElements());
        verify(taskRepository).findReviewQueueImages(null, currentManagerId, "PENDING_REVIEW", pageable);
        verify(projectAccessService, never()).findProjectAndCheckReadAccess(any());
    }

    @Test
    void getPendingReviewImages_HandlesUnassignedTaskWithoutAnnotationsAndFallsBackToCreatedAt() {
        Pageable pageable = PageRequest.of(0, 10);
        LocalDateTime createdAt = LocalDateTime.of(2026, 5, 15, 9, 0);
        pendingReviewTask.setAnnotator(null);
        pendingReviewTask.setUpdatedAt(null);
        pendingReviewTask.setCreatedAt(createdAt);

        when(projectAccessService.getCurrentUser()).thenReturn(User.builder().id(UUID.randomUUID()).role("REVIEWER").build());
        when(taskRepository.findReviewQueueImages(projectId, null, "PENDING_REVIEW", pageable))
                .thenReturn(new PageImpl<>(List.of(pendingReviewTask), pageable, 1));
        when(annotationRepository.findByTaskIdInOrderByTaskIdAscCreatedAtAsc(List.of(taskId))).thenReturn(List.of());

        PageResponse<ReviewQueueImageResponse> response = reviewQueueService.getPendingReviewImages(projectId, pageable);

        ReviewQueueImageResponse image = response.getData().getFirst();
        assertNull(image.getAnnotatorId());
        assertNull(image.getAnnotatorName());
        assertEquals(createdAt, image.getSubmittedAt());
        assertEquals(List.of(), image.getAnnotations());
    }

    @Test
    void getPendingReviewImages_NormalizesNullAiGeneratedFlagToFalse() {
        Pageable pageable = PageRequest.of(0, 10);
        annotation.setIsAiGenerated(null);

        when(projectAccessService.getCurrentUser()).thenReturn(User.builder().id(UUID.randomUUID()).role("REVIEWER").build());
        when(taskRepository.findReviewQueueImages(projectId, null, "PENDING_REVIEW", pageable))
                .thenReturn(new PageImpl<>(List.of(pendingReviewTask), pageable, 1));
        when(annotationRepository.findByTaskIdInOrderByTaskIdAscCreatedAtAsc(List.of(taskId)))
                .thenReturn(List.of(annotation));

        PageResponse<ReviewQueueImageResponse> response = reviewQueueService.getPendingReviewImages(projectId, pageable);

        assertEquals(false, response.getData().getFirst().getAnnotations().getFirst().getIsAiGenerated());
    }

    @Test
    void rejectImage_SuccessWithCommentsAndCategory() {
        UUID categoryId = UUID.randomUUID();
        RejectImageRequest request = RejectImageRequest.builder()
                .comments("Blurry image")
                .defectCategoryId(categoryId)
                .build();
        User reviewer = User.builder().id(UUID.randomUUID()).build();

        when(projectAccessService.getCurrentUser()).thenReturn(reviewer);
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(pendingReviewTask));
        when(defectCategoryRepository.findById(categoryId)).thenReturn(Optional.of(DefectCategory.builder().id(categoryId).build()));

        reviewQueueService.rejectImage(taskId, request);

        assertEquals("REJECTED", pendingReviewTask.getStatus());
        verify(taskRepository).save(pendingReviewTask);

        ArgumentCaptor<Review> reviewCaptor = ArgumentCaptor.forClass(Review.class);
        verify(reviewRepository).save(reviewCaptor.capture());
        Review savedReview = reviewCaptor.getValue();
        assertEquals(pendingReviewTask, savedReview.getTask());
        assertEquals(reviewer, savedReview.getReviewer());
        assertEquals("Blurry image", savedReview.getComments());
        assertEquals("REJECTED", savedReview.getAction());
        assertEquals(categoryId, savedReview.getDefectCategory().getId());
    }

    @Test
    void rejectImage_ThrowsTaskNotFound() {
        RejectImageRequest request = new RejectImageRequest();
        when(projectAccessService.getCurrentUser()).thenReturn(User.builder().build());
        when(taskRepository.findById(taskId)).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () -> reviewQueueService.rejectImage(taskId, request));
        assertEquals(ErrorCode.TASK_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    void rejectImage_ThrowsValidationError_WhenTaskNotPendingReview() {
        RejectImageRequest request = new RejectImageRequest();
        pendingReviewTask.setStatus("COMPLETED");
        when(projectAccessService.getCurrentUser()).thenReturn(User.builder().build());
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(pendingReviewTask));

        AppException ex = assertThrows(AppException.class, () -> reviewQueueService.rejectImage(taskId, request));
        assertEquals(ErrorCode.VALIDATION_ERROR, ex.getErrorCode());
        assertEquals("Task is not in PENDING_REVIEW status", ex.getMessage());
    }
}
