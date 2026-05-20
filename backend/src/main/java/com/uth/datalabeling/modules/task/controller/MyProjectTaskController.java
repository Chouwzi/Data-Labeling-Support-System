package com.uth.datalabeling.modules.task.controller;

import com.uth.datalabeling.common.response.ApiResponse;
import com.uth.datalabeling.modules.task.dto.response.BulkSubmitReadyResponse;
import com.uth.datalabeling.modules.task.service.TaskService;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/me/projects/{projectId}/tasks")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class MyProjectTaskController {

    TaskService taskService;

    @PostMapping("/submit-ready")
    @PreAuthorize("hasRole('ANNOTATOR')")
    public ApiResponse<BulkSubmitReadyResponse> submitReadyImages(@PathVariable UUID projectId) {
        return ApiResponse.<BulkSubmitReadyResponse>builder()
                .result(taskService.submitReadyImages(projectId))
                .build();
    }
}
