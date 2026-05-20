package com.uth.datalabeling.modules.task.controller;

import com.uth.datalabeling.common.response.ApiResponse;
import com.uth.datalabeling.common.response.PageResponse;
import com.uth.datalabeling.modules.task.dto.response.AssignedImageResponse;
import com.uth.datalabeling.modules.task.dto.response.BulkSubmitReadyResponse;
import com.uth.datalabeling.modules.task.service.TaskService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/me/assigned-images")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AssignedImageController {

    TaskService taskService;

    @GetMapping
    @PreAuthorize("hasRole('ANNOTATOR')")
    public ApiResponse<PageResponse<AssignedImageResponse>> getMyAssignedImages(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) String status,
            @ParameterObject @PageableDefault(size = 10) Pageable pageable) {
        return ApiResponse.<PageResponse<AssignedImageResponse>>builder()
                .result(taskService.getMyAssignedImages(projectId, status, pageable))
                .build();
    }

    @PostMapping("/projects/{projectId}/submit-ready")
    @PreAuthorize("hasRole('ANNOTATOR')")
    public ApiResponse<BulkSubmitReadyResponse> submitReadyImages(@PathVariable UUID projectId) {
        return ApiResponse.<BulkSubmitReadyResponse>builder()
                .result(taskService.submitReadyImages(projectId))
                .build();
    }
}
