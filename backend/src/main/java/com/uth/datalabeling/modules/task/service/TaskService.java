package com.uth.datalabeling.modules.task.service;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
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
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TaskService {

    TaskRepository taskRepository;
    ProjectRepository projectRepository;
    DatasetRepository datasetRepository;
    UserRepository userRepository;
    TaskMapper taskMapper;

    @Transactional
    public void generateTasksFromDataset(UUID projectId, UUID datasetId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new AppException(ErrorCode.PROJECT_NOT_FOUND));

        Dataset dataset = datasetRepository.findById(datasetId)
                .orElseThrow(() -> new AppException(ErrorCode.DATASET_NOT_FOUND));

        // Create a task for each sample in the dataset
        dataset.getDataSamples().forEach(sample -> {
            Task task = Task.builder()
                    .project(project)
                    .sample(sample)
                    .status("PENDING")
                    .build();
            taskRepository.save(task);
        });
    }

    @Transactional
    public List<TaskResponse> assignTasks(TaskAssignRequest request) {
        User annotator = userRepository.findById(request.getAnnotatorId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        List<Task> tasks = taskRepository.findAllById(request.getTaskIds());
        
        tasks.forEach(task -> {
            task.setAnnotator(annotator);
            task.setStatus("ASSIGNED");
        });

        return taskRepository.saveAll(tasks).stream()
                .map(taskMapper::toTaskResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> getTasksByProject(UUID projectId, String status) {
        // Simple implementation for now, could be improved with custom queries
        return taskRepository.findAll().stream()
                .filter(task -> task.getProject().getId().equals(projectId))
                .filter(task -> status == null || task.getStatus().equalsIgnoreCase(status))
                .map(taskMapper::toTaskResponse)
                .collect(Collectors.toList());
    }
}
