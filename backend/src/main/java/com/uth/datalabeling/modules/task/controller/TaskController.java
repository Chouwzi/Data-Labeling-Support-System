package com.uth.datalabeling.modules.task.controller;

import com.uth.datalabeling.common.response.ApiResponse;
import com.uth.datalabeling.modules.task.dto.request.TaskAssignRequest;
import com.uth.datalabeling.modules.task.dto.request.TaskSplitRequest;
import com.uth.datalabeling.modules.task.dto.response.GenerateTasksResponse;
import com.uth.datalabeling.modules.task.dto.response.ProjectWorkloadResponse;
import com.uth.datalabeling.modules.task.dto.response.TaskResponse;
import com.uth.datalabeling.modules.task.service.TaskService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/projects/{projectId}/tasks")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TaskController {

    TaskService taskService;

    /**
     * Tạo danh sách công việc (Tasks) cho dự án từ một tập dữ liệu (Dataset).
     * Yêu cầu quyền MANAGER hoặc ADMIN.
     */
    @PostMapping("/generate")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ApiResponse<GenerateTasksResponse> generateTasks(
            @PathVariable UUID projectId,
            @RequestParam UUID datasetId) {
        GenerateTasksResponse response = taskService.generateTasksFromDataset(projectId, datasetId);
        return ApiResponse.<GenerateTasksResponse>builder()
                .message("Công việc đã được tạo thành công từ tập dữ liệu.")
                .result(response)
                .build();
    }

    /**
     * Lấy danh sách công việc của một dự án, có thể lọc theo trạng thái.
     * Yêu cầu quyền MANAGER, ADMIN hoặc ANNOTATOR.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'ANNOTATOR')")
    public ApiResponse<List<TaskResponse>> getTasks(
            @PathVariable UUID projectId,
            @RequestParam(required = false) String status) {
        return ApiResponse.<List<TaskResponse>>builder()
                .result(taskService.getTasksByProject(projectId, status))
                .build();
    }

    /**
     * Phân bổ công việc cho người gắn nhãn (Annotator).
     * Yêu cầu quyền MANAGER hoặc ADMIN.
     */
    @PutMapping("/assign")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ApiResponse<List<TaskResponse>> assignTasks(
            @PathVariable UUID projectId,
            @RequestBody @Valid TaskAssignRequest request) {
        return ApiResponse.<List<TaskResponse>>builder()
                .result(taskService.assignTasks(projectId, request))
                .build();
    }

    @GetMapping("/workload")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ApiResponse<ProjectWorkloadResponse> getWorkload(@PathVariable UUID projectId) {
        return ApiResponse.<ProjectWorkloadResponse>builder()
                .result(taskService.getProjectWorkload(projectId))
                .build();
    }

    @PostMapping("/split")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ApiResponse<List<TaskResponse>> splitTasks(
            @PathVariable UUID projectId,
            @RequestBody @Valid TaskSplitRequest request) {
        return ApiResponse.<List<TaskResponse>>builder()
                .result(taskService.splitTasks(projectId, request))
                .build();
    }
}
