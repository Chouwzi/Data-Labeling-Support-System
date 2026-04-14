package com.uth.datalabeling.modules.project.controller;

import java.util.UUID;

import com.uth.datalabeling.common.response.ApiResponse;
import com.uth.datalabeling.common.response.PageResponse;
import com.uth.datalabeling.modules.activitylog.annotation.LogActivity;
import com.uth.datalabeling.modules.project.dto.request.ProjectCreateRequest;
import com.uth.datalabeling.modules.project.dto.request.ProjectUpdateRequest;
import com.uth.datalabeling.modules.project.dto.response.ProjectResponse;
import com.uth.datalabeling.modules.project.service.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import org.springdoc.core.annotations.ParameterObject;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Các API quản lý vòng đời Dự án.
 */
@RestController
@RequestMapping("/projects")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProjectController {
    ProjectService projectService;

    /**
     * Tạo mới một dự án.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    @LogActivity(action = "CREATE_PROJECT", entityType = "PROJECT")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ProjectResponse> createProject(@RequestBody @Valid ProjectCreateRequest request) {
        ProjectResponse response = projectService.createProject(request);
        return ApiResponse.<ProjectResponse>builder()
                .code(HttpStatus.CREATED.value())
                .result(response)
                .build();
    }

    /**
     * Lấy danh sách dự án (phân trang).
     *
     * Lưu ý format sort của Spring Pageable:
     * - Đúng: ?page=0&size=10&sort=createdAt,asc
     * - Sai: ?sort=["ASC"] (dạng JSON array sẽ gây lỗi parse tham số)
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    @LogActivity(action = "VIEW_ALL_PROJECTS")
        @Operation(
            summary = "Lấy danh sách dự án",
            description = "Phân trang theo chuẩn Spring Pageable với query params page, size, sort. "
                + "Ví dụ đúng: ?page=0&size=10&sort=createdAt,asc. "
                + "Không dùng JSON array như sort=[\"createdAt,asc\"].")
    public ApiResponse<PageResponse<ProjectResponse>> getAllProjects(
            @ParameterObject @PageableDefault(size = 10) Pageable pageable) {
        PageResponse<ProjectResponse> response = projectService.getAllProjects(pageable);
        return ApiResponse.<PageResponse<ProjectResponse>>builder()
                .result(response)
                .build();
    }

    /**
     * Lấy chi tiết một dự án.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    @LogActivity(action = "VIEW_PROJECT", entityType = "PROJECT", entityIdParam = "id")
    public ApiResponse<ProjectResponse> getProjectById(@PathVariable UUID id) {
        ProjectResponse response = projectService.getProjectById(id);
        return ApiResponse.<ProjectResponse>builder()
                .result(response)
                .build();
    }

    /**
     * Cập nhật thông tin dự án.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    @LogActivity(action = "UPDATE_PROJECT", entityType = "PROJECT", entityIdParam = "id")
    public ApiResponse<ProjectResponse> updateProject(
            @PathVariable UUID id,
            @RequestBody @Valid ProjectUpdateRequest request) {
        ProjectResponse response = projectService.updateProject(id, request);
        return ApiResponse.<ProjectResponse>builder()
                .result(response)
                .build();
    }

    /**
     * Xóa mềm dự án.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    @LogActivity(action = "DELETE_PROJECT", entityType = "PROJECT", entityIdParam = "id")
    public ApiResponse<Void> deleteProject(@PathVariable UUID id) {
        projectService.deleteProject(id);
        return ApiResponse.<Void>builder()
                .message("Dự án đã được xóa thành công.")
                .build();
    }
}
