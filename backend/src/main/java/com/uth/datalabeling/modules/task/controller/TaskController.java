package com.uth.datalabeling.modules.task.controller;

import com.uth.datalabeling.common.response.ApiResponse;
import com.uth.datalabeling.modules.task.dto.request.TaskAssignRequest;
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

    @PostMapping("/generate")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ApiResponse<Void> generateTasks(
            @PathVariable UUID projectId,
            @RequestParam UUID datasetId) {
        taskService.generateTasksFromDataset(projectId, datasetId);
        return ApiResponse.<Void>builder()
                .message("Công việc đã được tạo thành công từ tập dữ liệu.")
                .build();
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'ANNOTATOR')")
    public ApiResponse<List<TaskResponse>> getTasks(
            @PathVariable UUID projectId,
            @RequestParam(required = false) String status) {
        return ApiResponse.<List<TaskResponse>>builder()
                .result(taskService.getTasksByProject(projectId, status))
                .build();
    }

    @PutMapping("/assign")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ApiResponse<List<TaskResponse>> assignTasks(
            @PathVariable UUID projectId,
            @RequestBody @Valid TaskAssignRequest request) {
        // In a real scenario, we might want to verify that the tasks belong to the projectId
        return ApiResponse.<List<TaskResponse>>builder()
                .result(taskService.assignTasks(request))
                .build();
    }
}
