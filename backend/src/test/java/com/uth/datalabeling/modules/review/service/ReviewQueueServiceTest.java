package com.uth.datalabeling.modules.review.service;

import com.uth.datalabeling.common.response.PageResponse;
import com.uth.datalabeling.modules.annotation.entity.Annotation;
import com.uth.datalabeling.modules.annotation.entity.AnnotationShapeType;
import com.uth.datalabeling.modules.annotation.repository.AnnotationRepository;
import com.uth.datalabeling.modules.dataset.entity.DataSample;
import com.uth.datalabeling.modules.iam.entity.User;
import com.uth.datalabeling.modules.project.entity.Label;
import com.uth.datalabeling.modules.project.entity.Project;
import com.uth.datalabeling.modules.review.dto.response.ReviewQueueImageResponse;
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReviewQueueServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private AnnotationRepository annotationRepository;

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
        when(taskRepository.findReviewQueueImages(projectId, "PENDING_REVIEW", pageable))
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

        verify(taskRepository).findReviewQueueImages(projectId, "PENDING_REVIEW", pageable);
        verify(annotationRepository).findByTaskIdInOrderByTaskIdAscCreatedAtAsc(List.of(taskId));
    }

    @Test
    void getPendingReviewImages_WithNullProjectFilterRequestsAllPendingReviewTasks() {
        Pageable pageable = PageRequest.of(2, 25);
        when(taskRepository.findReviewQueueImages(null, "PENDING_REVIEW", pageable))
                .thenReturn(new PageImpl<>(List.of(), pageable, 0));

        PageResponse<ReviewQueueImageResponse> response = reviewQueueService.getPendingReviewImages(null, pageable);

        assertEquals(2, response.getCurrentPage());
        assertEquals(25, response.getPageSize());
        assertEquals(0, response.getTotalElements());
        assertEquals(List.of(), response.getData());
        verify(taskRepository).findReviewQueueImages(null, "PENDING_REVIEW", pageable);
        verify(annotationRepository, never()).findByTaskIdInOrderByTaskIdAscCreatedAtAsc(List.of());
    }

    @Test
    void getPendingReviewImages_HandlesUnassignedTaskWithoutAnnotationsAndFallsBackToCreatedAt() {
        Pageable pageable = PageRequest.of(0, 10);
        LocalDateTime createdAt = LocalDateTime.of(2026, 5, 15, 9, 0);
        pendingReviewTask.setAnnotator(null);
        pendingReviewTask.setUpdatedAt(null);
        pendingReviewTask.setCreatedAt(createdAt);

        when(taskRepository.findReviewQueueImages(projectId, "PENDING_REVIEW", pageable))
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

        when(taskRepository.findReviewQueueImages(projectId, "PENDING_REVIEW", pageable))
                .thenReturn(new PageImpl<>(List.of(pendingReviewTask), pageable, 1));
        when(annotationRepository.findByTaskIdInOrderByTaskIdAscCreatedAtAsc(List.of(taskId)))
                .thenReturn(List.of(annotation));

        PageResponse<ReviewQueueImageResponse> response = reviewQueueService.getPendingReviewImages(projectId, pageable);

        assertEquals(false, response.getData().getFirst().getAnnotations().getFirst().getIsAiGenerated());
    }
}
