package com.uth.datalabeling.modules.project.controller;

import com.uth.datalabeling.common.response.ApiResponse;
import com.uth.datalabeling.common.response.PageResponse;
import com.uth.datalabeling.modules.project.dto.response.ProjectResponse;
import com.uth.datalabeling.modules.project.service.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/me/projects")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class MyProjectController {

    ProjectService projectService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ANNOTATOR', 'REVIEWER')")
    @Operation(
            summary = "Lấy danh sách dự án được giao cho annotator hiện tại",
            description = "Trả về các project mà annotator hiện tại có task được giao, kèm guideline và labels.")
    public ApiResponse<PageResponse<ProjectResponse>> getMyAssignedProjects(
            @RequestParam(required = false) String role,
            @ParameterObject @PageableDefault(size = 10) Pageable pageable) {
        PageResponse<ProjectResponse> response = projectService.getMyAssignedProjects(role, pageable);
        return ApiResponse.<PageResponse<ProjectResponse>>builder()
                .result(response)
                .build();
    }
}
