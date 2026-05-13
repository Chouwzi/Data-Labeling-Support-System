package com.uth.datalabeling.modules.task.service;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import com.uth.datalabeling.common.response.PageResponse;
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
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
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
    ProjectAccessService projectAccessService;

    /**
     * Tạo danh sách công việc (Tasks) từ các mẫu dữ liệu trong một tập dữ liệu (Dataset).
     */
    @Transactional
    public void generateTasksFromDataset(UUID projectId, UUID datasetId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new AppException(ErrorCode.PROJECT_NOT_FOUND));

        Dataset dataset = datasetRepository.findById(datasetId)
                .orElseThrow(() -> new AppException(ErrorCode.DATASET_NOT_FOUND));

        // Tạo một task cho mỗi mẫu dữ liệu trong dataset
        dataset.getDataSamples().forEach(sample -> {
            Task task = Task.builder()
                    .project(project)
                    .sample(sample)
                    .status("PENDING")
                    .build();
            taskRepository.save(task);
        });
    }

    /**
     * Phân bổ danh sách công việc cho một người gắn nhãn (Annotator).
     */
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

    /**
     * Lấy danh sách công việc của dự án, hỗ trợ lọc theo trạng thái.
     */
    @Transactional(readOnly = true)
    public List<TaskResponse> getTasksByProject(UUID projectId, String status) {
        // Hiện tại dùng cách lọc đơn giản, có thể tối ưu bằng custom query trong repository
        return taskRepository.findAll().stream()
                .filter(task -> task.getProject().getId().equals(projectId))
                .filter(task -> status == null || task.getStatus().equalsIgnoreCase(status))
                .map(taskMapper::toTaskResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lấy danh sách hình ảnh được giao cho annotator đang đăng nhập.
     */
    @Transactional(readOnly = true)
    public PageResponse<AssignedImageResponse> getMyAssignedImages(UUID projectId, String status, Pageable pageable) {
        User currentUser = projectAccessService.getCurrentUser();
        String normalizedStatus = normalizeStatus(status);
        Page<Task> taskPage = taskRepository.findAssignedImagesForAnnotator(
                currentUser.getId(),
                projectId,
                normalizedStatus,
                pageable);

        return PageResponse.<AssignedImageResponse>builder()
                .currentPage(taskPage.getNumber())
                .totalPages(taskPage.getTotalPages())
                .pageSize(taskPage.getSize())
                .totalElements(taskPage.getTotalElements())
                .data(taskPage.getContent().stream()
                        .map(this::toAssignedImageResponse)
                        .collect(Collectors.toList()))
                .build();
    }

    private String normalizeStatus(String status) {
        if (status == null || status.trim().isEmpty()) {
            return null;
        }
        return status.trim().toUpperCase();
    }

    private AssignedImageResponse toAssignedImageResponse(Task task) {
        LocalDateTime assignedAt = task.getUpdatedAt() != null ? task.getUpdatedAt() : task.getCreatedAt();
        return AssignedImageResponse.builder()
                .taskId(task.getId())
                .projectId(task.getProject().getId())
                .projectName(task.getProject().getName())
                .sampleId(task.getSample().getId())
                .imageUrl(task.getSample().getImageUrl())
                .status(task.getStatus())
                .assignedAt(assignedAt)
                .build();
    }
}
