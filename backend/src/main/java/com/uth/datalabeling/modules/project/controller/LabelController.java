package com.uth.datalabeling.modules.project.controller;

import java.util.List;
import java.util.UUID;

import com.uth.datalabeling.common.response.ApiResponse;
import com.uth.datalabeling.modules.activitylog.annotation.LogActivity;
import com.uth.datalabeling.modules.project.dto.request.LabelRequest;
import com.uth.datalabeling.modules.project.dto.response.LabelResponse;
import com.uth.datalabeling.modules.project.service.LabelService;
import io.swagger.v3.oas.annotations.Operation;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Các API quản lý Nhãn dán của Dự án.
 */
@RestController
@RequestMapping("/projects/{projectId}/labels")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class LabelController {
    LabelService labelService;

    /**
     * Tạo mới một nhãn dán cho dự án.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    @LogActivity(action = "CREATE_LABEL", entityType = "LABEL")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<LabelResponse> createLabel(
            @PathVariable UUID projectId,
            @RequestBody @Valid LabelRequest request) {
        LabelResponse response = labelService.createLabel(projectId, request);
        return ApiResponse.<LabelResponse>builder()
                .code(HttpStatus.CREATED.value())
                .result(response)
                .build();
    }

    /**
     * Lấy danh sách toàn bộ nhãn dán của dự án.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'ANNOTATOR', 'REVIEWER')")
    @LogActivity(action = "VIEW_LABELS", entityType = "PROJECT", entityIdParam = "projectId")
    @Operation(summary = "Lấy danh sách nhãn dán của dự án")
    public ApiResponse<List<LabelResponse>> getLabelsByProject(@PathVariable UUID projectId) {
        List<LabelResponse> response = labelService.getLabelsByProject(projectId);
        return ApiResponse.<List<LabelResponse>>builder()
                .result(response)
                .build();
    }

    /**
     * Cập nhật thông tin nhãn dán.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    @LogActivity(action = "UPDATE_LABEL", entityType = "LABEL", entityIdParam = "id")
    public ApiResponse<LabelResponse> updateLabel(
            @PathVariable UUID projectId,
            @PathVariable UUID id,
            @RequestBody @Valid LabelRequest request) {
        LabelResponse response = labelService.updateLabel(projectId, id, request);
        return ApiResponse.<LabelResponse>builder()
                .result(response)
                .build();
    }

    /**
     * Xóa mềm nhãn dán.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    @LogActivity(action = "DELETE_LABEL", entityType = "LABEL", entityIdParam = "id")
    public ApiResponse<Void> deleteLabel(
            @PathVariable UUID projectId,
            @PathVariable UUID id) {
        labelService.deleteLabel(projectId, id);
        return ApiResponse.<Void>builder()
                .message("Nhãn dán đã được xóa thành công.")
                .build();
    }
}
