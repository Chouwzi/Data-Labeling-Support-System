package com.uth.datalabeling.modules.annotation.service;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import com.uth.datalabeling.modules.annotation.dto.request.AnnotationSubmitRequest;
import com.uth.datalabeling.modules.annotation.dto.response.AnnotationResponse;
import com.uth.datalabeling.modules.annotation.entity.Annotation;
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

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
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
    private DataSample sample;
    private Task assignedTask;
    private AnnotationSubmitRequest request;
    private List<Map<String, Object>> result;

    @BeforeEach
    void setUp() {
        taskId = UUID.randomUUID();
        projectId = UUID.randomUUID();
        annotatorId = UUID.randomUUID();
        labelId = UUID.randomUUID();
        annotator = User.builder().id(annotatorId).email("ann@example.com").role("ANNOTATOR").build();
        project = Project.builder().id(projectId).name("Traffic Signs").build();
        sample = DataSample.builder().id(UUID.randomUUID()).imageUrl("https://cdn.example.com/image.jpg").build();
        assignedTask = Task.builder()
                .id(taskId)
                .project(project)
                .sample(sample)
                .annotator(annotator)
                .status("ASSIGNED")
                .build();
        result = List.of(Map.of(
                "type", "BOUNDING_BOX",
                "label_id", labelId.toString(),
                "geometry", Map.of("x", 20, "y", 30, "width", 50, "height", 60)
        ));
        request = AnnotationSubmitRequest.builder()
                .result(result)
                .leadTimeSeconds(42)
                .build();
    }

    @Test
    void submitAnnotation_SavesAnnotationAndMarksTaskSubmitted() {
        Label label = Label.builder().id(labelId).project(project).name("Stop Sign").build();
        UUID annotationId = UUID.randomUUID();

        when(projectAccessService.getCurrentUser()).thenReturn(annotator);
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(assignedTask));
        when(labelRepository.findByIdAndProjectIdAndDeletedAtIsNull(labelId, projectId)).thenReturn(Optional.of(label));
        when(annotationRepository.save(any(Annotation.class))).thenAnswer(invocation -> {
            Annotation annotation = invocation.getArgument(0);
            annotation.setId(annotationId);
            return annotation;
        });

        AnnotationResponse response = annotationService.submitAnnotation(taskId, request);

        assertEquals(annotationId, response.getId());
        assertEquals(taskId, response.getTaskId());
        assertEquals(annotatorId, response.getAnnotatorId());
        assertEquals("SUBMITTED", response.getStatus());
        assertEquals(result, response.getResult());
        assertEquals(42, response.getLeadTimeSeconds());
        assertNotNull(response.getSubmittedAt());
        assertEquals("SUBMITTED", assignedTask.getStatus());

        ArgumentCaptor<Annotation> annotationCaptor = ArgumentCaptor.forClass(Annotation.class);
        verify(annotationRepository).save(annotationCaptor.capture());
        Annotation saved = annotationCaptor.getValue();
        assertSame(assignedTask, saved.getTask());
        assertSame(annotator, saved.getAnnotator());
        assertEquals(result, saved.getResult());
        assertEquals(42, saved.getLeadTimeSeconds());
        assertEquals("SUBMITTED", saved.getStatus());
        assertNotNull(saved.getSubmittedAt());
        verify(taskRepository).save(assignedTask);
    }

    @Test
    void submitAnnotation_RejectsTaskAssignedToAnotherAnnotator() {
        User otherAnnotator = User.builder().id(UUID.randomUUID()).role("ANNOTATOR").build();
        assignedTask.setAnnotator(otherAnnotator);

        when(projectAccessService.getCurrentUser()).thenReturn(annotator);
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(assignedTask));

        AppException exception = assertThrows(AppException.class,
                () -> annotationService.submitAnnotation(taskId, request));

        assertEquals(ErrorCode.FORBIDDEN, exception.getErrorCode());
    }

    @Test
    void submitAnnotation_ThrowsTaskNotFoundWhenTaskMissing() {
        when(projectAccessService.getCurrentUser()).thenReturn(annotator);
        when(taskRepository.findById(taskId)).thenReturn(Optional.empty());

        AppException exception = assertThrows(AppException.class,
                () -> annotationService.submitAnnotation(taskId, request));

        assertEquals(ErrorCode.TASK_NOT_FOUND, exception.getErrorCode());
    }

    @Test
    void submitAnnotation_RejectsInvalidTaskStatus() {
        assignedTask.setStatus("SUBMITTED");

        when(projectAccessService.getCurrentUser()).thenReturn(annotator);
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(assignedTask));

        AppException exception = assertThrows(AppException.class,
                () -> annotationService.submitAnnotation(taskId, request));

        assertEquals(ErrorCode.CONFLICT, exception.getErrorCode());
    }

    @Test
    void submitAnnotation_RejectsLabelOutsideTaskProject() {
        when(projectAccessService.getCurrentUser()).thenReturn(annotator);
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(assignedTask));
        when(labelRepository.findByIdAndProjectIdAndDeletedAtIsNull(labelId, projectId)).thenReturn(Optional.empty());

        AppException exception = assertThrows(AppException.class,
                () -> annotationService.submitAnnotation(taskId, request));

        assertEquals(ErrorCode.LABEL_NOT_FOUND, exception.getErrorCode());
    }

    @Test
    void submitAnnotation_RejectsMissingLabelIdInResultItem() {
        request.setResult(List.of(Map.of(
                "type", "BOUNDING_BOX",
                "geometry", Map.of("x", 20, "y", 30, "width", 50, "height", 60)
        )));

        when(projectAccessService.getCurrentUser()).thenReturn(annotator);
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(assignedTask));

        AppException exception = assertThrows(AppException.class,
                () -> annotationService.submitAnnotation(taskId, request));

        assertEquals(ErrorCode.VALIDATION_ERROR, exception.getErrorCode());
    }
}
