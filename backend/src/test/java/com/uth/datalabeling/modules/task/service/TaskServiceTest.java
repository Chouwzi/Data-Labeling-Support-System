package com.uth.datalabeling.modules.task.service;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.modules.dataset.entity.DataSample;
import com.uth.datalabeling.modules.dataset.entity.Dataset;
import com.uth.datalabeling.modules.dataset.repository.DatasetRepository;
import com.uth.datalabeling.modules.iam.entity.User;
import com.uth.datalabeling.modules.iam.repository.UserRepository;
import com.uth.datalabeling.modules.project.entity.Project;
import com.uth.datalabeling.modules.project.repository.ProjectRepository;
import com.uth.datalabeling.modules.project.service.ProjectAccessService;
import com.uth.datalabeling.modules.task.dto.request.TaskAssignRequest;
import com.uth.datalabeling.modules.task.dto.response.AssignedImageResponse;
import com.uth.datalabeling.modules.task.dto.response.TaskResponse;
import com.uth.datalabeling.modules.task.entity.Task;
import com.uth.datalabeling.modules.task.mapper.TaskMapper;
import com.uth.datalabeling.modules.task.repository.TaskRepository;
import com.uth.datalabeling.common.response.PageResponse;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private DatasetRepository datasetRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TaskMapper taskMapper;

    @Mock
    private ProjectAccessService projectAccessService;

    @InjectMocks
    private TaskService taskService;

    private UUID projectId;
    private UUID datasetId;
    private Project project;
    private Dataset dataset;
    private DataSample sample;

    @BeforeEach
    void setUp() {
        projectId = UUID.randomUUID();
        datasetId = UUID.randomUUID();
        project = Project.builder().id(projectId).name("Test Project").build();
        sample = DataSample.builder().id(UUID.randomUUID()).build();
        dataset = Dataset.builder()
                .id(datasetId)
                .dataSamples(List.of(sample))
                .build();
    }

    @Test
    void generateTasksFromDataset_Success() {
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(datasetRepository.findById(datasetId)).thenReturn(Optional.of(dataset));

        taskService.generateTasksFromDataset(projectId, datasetId);

        verify(taskRepository, times(1)).save(any(Task.class));
    }

    @Test
    void assignTasks_Success() {
        UUID annotatorId = UUID.randomUUID();
        User annotator = User.builder().id(annotatorId).role("ANNOTATOR").build();
        UUID taskId = UUID.randomUUID();
        Task task = Task.builder().id(taskId).status("PENDING").build();
        TaskAssignRequest request = new TaskAssignRequest(List.of(taskId), annotatorId);

        when(userRepository.findById(annotatorId)).thenReturn(Optional.of(annotator));
        when(taskRepository.findAllById(anyList())).thenReturn(List.of(task));
        when(taskRepository.saveAll(anyList())).thenReturn(List.of(task));
        when(taskMapper.toTaskResponse(any(Task.class))).thenReturn(new TaskResponse());

        List<TaskResponse> result = taskService.assignTasks(request);

        assertNotNull(result);
        assertEquals("ASSIGNED", task.getStatus());
        assertEquals(annotator, task.getAnnotator());
        assertNotNull(task.getAssignedAt());
        verify(taskRepository).saveAll(anyList());
    }

    @Test
    void getTasksByProject_Success() {
        Task task = Task.builder().project(project).status("PENDING").build();
        when(taskRepository.findAll()).thenReturn(List.of(task));
        when(taskMapper.toTaskResponse(any())).thenReturn(new TaskResponse());

        List<TaskResponse> result = taskService.getTasksByProject(projectId, null);

        assertNotNull(result);
        assertEquals(1, result.size());
    }

    @Test
    void getMyAssignedImages_UsesCurrentUserAndMapsAssignedImageResponse() {
        UUID annotatorId = UUID.randomUUID();
        UUID taskId = UUID.randomUUID();
        UUID sampleId = UUID.randomUUID();
        LocalDateTime createdAt = LocalDateTime.of(2026, 5, 13, 9, 0);
        LocalDateTime assignedAt = LocalDateTime.of(2026, 5, 13, 9, 15);
        LocalDateTime updatedAt = LocalDateTime.of(2026, 5, 13, 10, 25);
        User annotator = User.builder().id(annotatorId).email("ann@example.com").role("ANNOTATOR").build();
        Project projectWithName = Project.builder()
                .id(projectId)
                .name("Traffic Sign Labeling")
                .build();
        DataSample sampleWithImage = DataSample.builder()
                .id(sampleId)
                .imageUrl("https://cdn.example.com/image-001.jpg")
                .build();
        Task task = Task.builder()
                .id(taskId)
                .project(projectWithName)
                .sample(sampleWithImage)
                .annotator(annotator)
                .status("ASSIGNED")
                .createdAt(createdAt)
                .assignedAt(assignedAt)
                .updatedAt(updatedAt)
                .build();
        Pageable pageable = PageRequest.of(0, 10);

        when(projectAccessService.getCurrentUser()).thenReturn(annotator);
        when(taskRepository.findAssignedImagesForAnnotator(eq(annotatorId), eq(projectId), eq("ASSIGNED"), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(task), pageable, 1));

        PageResponse<AssignedImageResponse> result = taskService.getMyAssignedImages(projectId, " assigned ", pageable);

        assertEquals(0, result.getCurrentPage());
        assertEquals(1, result.getTotalPages());
        assertEquals(10, result.getPageSize());
        assertEquals(1, result.getTotalElements());
        assertEquals(1, result.getData().size());
        AssignedImageResponse image = result.getData().get(0);
        assertEquals(taskId, image.getTaskId());
        assertEquals(projectId, image.getProjectId());
        assertEquals("Traffic Sign Labeling", image.getProjectName());
        assertEquals(sampleId, image.getSampleId());
        assertEquals("https://cdn.example.com/image-001.jpg", image.getImageUrl());
        assertEquals("ASSIGNED", image.getStatus());
        assertEquals(assignedAt, image.getAssignedAt());
        verify(projectAccessService).getCurrentUser();
        verify(taskRepository).findAssignedImagesForAnnotator(annotatorId, projectId, "ASSIGNED", pageable);
    }

    @Test
    void getMyAssignedImages_FallsBackToCreatedAtWhenAssignedAtIsNull() {
        UUID annotatorId = UUID.randomUUID();
        LocalDateTime createdAt = LocalDateTime.of(2026, 5, 13, 9, 0);
        LocalDateTime updatedAt = LocalDateTime.of(2026, 5, 13, 10, 25);
        User annotator = User.builder().id(annotatorId).role("ANNOTATOR").build();
        Task task = Task.builder()
                .id(UUID.randomUUID())
                .project(project)
                .sample(sample)
                .annotator(annotator)
                .status("ASSIGNED")
                .createdAt(createdAt)
                .updatedAt(updatedAt)
                .build();
        Pageable pageable = PageRequest.of(0, 10);

        when(projectAccessService.getCurrentUser()).thenReturn(annotator);
        when(taskRepository.findAssignedImagesForAnnotator(eq(annotatorId), eq(null), eq(null), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(task), pageable, 1));

        PageResponse<AssignedImageResponse> result = taskService.getMyAssignedImages(null, null, pageable);

        assertEquals(createdAt, result.getData().get(0).getAssignedAt());
        verify(taskRepository).findAssignedImagesForAnnotator(annotatorId, null, null, pageable);
    }
}
