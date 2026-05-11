package com.uth.datalabeling.modules.task.service;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.modules.dataset.entity.DataSample;
import com.uth.datalabeling.modules.dataset.entity.Dataset;
import com.uth.datalabeling.modules.dataset.repository.DatasetRepository;
import com.uth.datalabeling.modules.iam.entity.User;
import com.uth.datalabeling.modules.iam.repository.UserRepository;
import com.uth.datalabeling.modules.project.entity.Project;
import com.uth.datalabeling.modules.project.repository.ProjectRepository;
import com.uth.datalabeling.modules.task.dto.request.TaskAssignRequest;
import com.uth.datalabeling.modules.task.dto.response.TaskResponse;
import com.uth.datalabeling.modules.task.entity.Task;
import com.uth.datalabeling.modules.task.mapper.TaskMapper;
import com.uth.datalabeling.modules.task.repository.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
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
}
