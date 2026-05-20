package com.uth.datalabeling.modules.annotation.service;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import com.uth.datalabeling.modules.annotation.dto.request.AnnotationItemRequest;
import com.uth.datalabeling.modules.annotation.dto.request.SaveAnnotationsRequest;
import com.uth.datalabeling.modules.annotation.dto.response.AnnotationResponse;
import com.uth.datalabeling.modules.annotation.entity.Annotation;
import com.uth.datalabeling.modules.annotation.entity.AnnotationShapeType;
import com.uth.datalabeling.modules.annotation.repository.AnnotationRepository;
import com.uth.datalabeling.modules.dataset.entity.DataSample;
import com.uth.datalabeling.modules.iam.entity.User;
import com.uth.datalabeling.modules.project.entity.Label;
import com.uth.datalabeling.modules.project.entity.Project;
import com.uth.datalabeling.modules.project.repository.LabelRepository;
import com.uth.datalabeling.modules.project.service.ProjectAccessService;
import com.uth.datalabeling.modules.task.entity.Task;
import com.uth.datalabeling.modules.task.repository.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AnnotationServiceTest {

    @Mock
    private AnnotationRepository annotationRepository;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private LabelRepository labelRepository;

    @Mock
    private ProjectAccessService projectAccessService;

    @InjectMocks
    private AnnotationService annotationService;

    private UUID taskId;
    private UUID projectId;
    private UUID annotatorId;
    private UUID labelId;
    private User annotator;
    private Project project;
    private Task assignedTask;
    private Label label;

    @BeforeEach
    void setUp() {
        taskId = UUID.randomUUID();
        projectId = UUID.randomUUID();
        annotatorId = UUID.randomUUID();
        labelId = UUID.randomUUID();
        annotator = User.builder().id(annotatorId).email("ann@example.com").role("ANNOTATOR").build();
        project = Project.builder().id(projectId).name("Traffic Signs").managerId(UUID.randomUUID()).build();
        DataSample sample = DataSample.builder().id(UUID.randomUUID()).imageUrl("uploads/traffic.jpg").build();
        assignedTask = Task.builder()
                .id(taskId)
                .project(project)
                .sample(sample)
                .annotator(annotator)
                .status("ASSIGNED")
                .build();
        label = Label.builder().id(labelId).project(project).name("Stop Sign").colorHex("#FF0000").build();
    }

    @Test
    void saveAnnotations_ReplacesTaskAnnotationsAndMarksInProgress() {
        SaveAnnotationsRequest request = request(false, bbox(labelId, "0.10", "0.20", "0.30", "0.40"));
        UUID annotationId = UUID.randomUUID();

        when(projectAccessService.getCurrentUser()).thenReturn(annotator);
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(assignedTask));
        when(labelRepository.findByIdAndProjectIdAndDeletedAtIsNull(labelId, projectId)).thenReturn(Optional.of(label));
        when(annotationRepository.saveAllAndFlush(any())).thenAnswer(invocation -> {
            List<Annotation> annotations = invocation.getArgument(0);
            annotations.getFirst().setId(annotationId);
            return annotations;
        });

        List<AnnotationResponse> response = annotationService.saveAnnotations(taskId, request);

        assertEquals(1, response.size());
        assertEquals(annotationId, response.getFirst().getId());
        assertEquals(taskId, response.getFirst().getTaskId());
        assertEquals(AnnotationShapeType.BOUNDING_BOX, response.getFirst().getShapeType());
        assertEquals(labelId, response.getFirst().getLabelId());
        assertEquals("Stop Sign", response.getFirst().getLabelName());
        assertEquals("#FF0000", response.getFirst().getColorHex());
        assertEquals(Map.of("x", 0.10, "y", 0.20, "width", 0.30, "height", 0.40),
                response.getFirst().getGeometry());
        assertEquals("IN_PROGRESS", assignedTask.getStatus());

        verify(annotationRepository).deleteByTaskId(taskId);
        ArgumentCaptor<List<Annotation>> captor = ArgumentCaptor.forClass(List.class);
        verify(annotationRepository).saveAllAndFlush(captor.capture());
        Annotation saved = captor.getValue().getFirst();
        assertEquals(assignedTask, saved.getTask());
        assertEquals(label, saved.getLabel());
        assertEquals(annotator, saved.getCreatedBy());
        assertEquals(AnnotationShapeType.BOUNDING_BOX, saved.getShapeType());
        assertEquals(Map.of("x", 0.10, "y", 0.20, "width", 0.30, "height", 0.40), saved.getGeometry());
        verify(taskRepository).save(assignedTask);
    }

    @Test
    void saveAnnotations_WithSubmitTrueMarksPendingReview() {
        SaveAnnotationsRequest request = request(true, bbox(labelId, "0.10", "0.20", "0.30", "0.40"));

        when(projectAccessService.getCurrentUser()).thenReturn(annotator);
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(assignedTask));
        when(labelRepository.findByIdAndProjectIdAndDeletedAtIsNull(labelId, projectId)).thenReturn(Optional.of(label));
        when(annotationRepository.saveAllAndFlush(any())).thenAnswer(invocation -> invocation.getArgument(0));

        annotationService.saveAnnotations(taskId, request);

        assertEquals("PENDING_REVIEW", assignedTask.getStatus());
        verify(taskRepository).save(assignedTask);
    }

    @Test
    void saveAnnotations_AllowsEmptyListAndClearsDraft() {
        SaveAnnotationsRequest request = SaveAnnotationsRequest.builder()
                .annotations(List.of())
                .submit(false)
                .build();

        when(projectAccessService.getCurrentUser()).thenReturn(annotator);
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(assignedTask));

        List<AnnotationResponse> response = annotationService.saveAnnotations(taskId, request);

        assertEquals(List.of(), response);
        assertEquals("IN_PROGRESS", assignedTask.getStatus());
        verify(annotationRepository).deleteByTaskId(taskId);
        verify(annotationRepository, never()).saveAllAndFlush(any());
        verify(taskRepository).save(assignedTask);
    }

    @Test
    void getAnnotations_ReturnsCurrentTaskAnnotations() {
        Annotation annotation = Annotation.builder()
                .id(UUID.randomUUID())
                .task(assignedTask)
                .label(label)
                .createdBy(annotator)
                .shapeType(AnnotationShapeType.BOUNDING_BOX)
                .geometry(Map.of("x", 0.1, "y", 0.2, "width", 0.3, "height", 0.4))
                .isAiGenerated(false)
                .build();

        when(projectAccessService.getCurrentUser()).thenReturn(annotator);
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(assignedTask));
        when(annotationRepository.findByTaskIdOrderByCreatedAtAsc(taskId)).thenReturn(List.of(annotation));

        List<AnnotationResponse> response = annotationService.getAnnotations(taskId);

        assertEquals(1, response.size());
        assertEquals(labelId, response.getFirst().getLabelId());
        assertEquals("Stop Sign", response.getFirst().getLabelName());
        assertEquals("#FF0000", response.getFirst().getColorHex());
    }

    @Test
    void saveAnnotations_RejectsLabelOutsideTaskProject() {
        SaveAnnotationsRequest request = request(false, bbox(labelId, "0.10", "0.20", "0.30", "0.40"));

        when(projectAccessService.getCurrentUser()).thenReturn(annotator);
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(assignedTask));
        when(labelRepository.findByIdAndProjectIdAndDeletedAtIsNull(labelId, projectId)).thenReturn(Optional.empty());

        AppException exception = assertThrows(AppException.class,
                () -> annotationService.saveAnnotations(taskId, request));

        assertEquals(ErrorCode.LABEL_NOT_FOUND, exception.getErrorCode());
    }

    @Test
    void saveAnnotations_RejectsBoundingBoxOutsideImageRatio() {
        SaveAnnotationsRequest request = request(false, bbox(labelId, "0.80", "0.20", "0.30", "0.40"));

        when(projectAccessService.getCurrentUser()).thenReturn(annotator);
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(assignedTask));
        when(labelRepository.findByIdAndProjectIdAndDeletedAtIsNull(labelId, projectId)).thenReturn(Optional.of(label));

        AppException exception = assertThrows(AppException.class,
                () -> annotationService.saveAnnotations(taskId, request));

        assertEquals(ErrorCode.VALIDATION_ERROR, exception.getErrorCode());
    }

    @Test
    void saveAnnotations_RejectsTaskAssignedToDifferentAnnotator() {
        assignedTask.setAnnotator(User.builder().id(UUID.randomUUID()).role("ANNOTATOR").build());
        SaveAnnotationsRequest request = request(false, bbox(labelId, "0.10", "0.20", "0.30", "0.40"));

        when(projectAccessService.getCurrentUser()).thenReturn(annotator);
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(assignedTask));

        AppException exception = assertThrows(AppException.class,
                () -> annotationService.saveAnnotations(taskId, request));

        assertEquals(ErrorCode.FORBIDDEN, exception.getErrorCode());
    }

    private SaveAnnotationsRequest request(boolean submit, AnnotationItemRequest... annotations) {
        return SaveAnnotationsRequest.builder()
                .annotations(List.of(annotations))
                .submit(submit)
                .build();
    }

    private AnnotationItemRequest bbox(UUID labelId, String x, String y, String width, String height) {
        return AnnotationItemRequest.builder()
                .shapeType(AnnotationShapeType.BOUNDING_BOX)
                .labelId(labelId)
                .geometry(Map.of(
                        "x", new BigDecimal(x),
                        "y", new BigDecimal(y),
                        "width", new BigDecimal(width),
                        "height", new BigDecimal(height)
                ))
                .isAiGenerated(false)
                .build();
    }
}
