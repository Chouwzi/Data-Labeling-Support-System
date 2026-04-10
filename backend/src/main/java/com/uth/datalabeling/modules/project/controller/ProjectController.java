package com.uth.datalabeling.modules.project.controller;

import com.uth.datalabeling.common.response.ApiResponse;
import com.uth.datalabeling.modules.project.dto.request.ProjectCreateRequest;
import com.uth.datalabeling.modules.project.dto.response.ProjectResponse;
import com.uth.datalabeling.modules.project.service.ProjectService;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/projects")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProjectController {
    ProjectService projectService;

    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ApiResponse<ProjectResponse> createProject(@RequestBody @Valid ProjectCreateRequest request) {
        ProjectResponse response = projectService.createProject(request);
        return ApiResponse.<ProjectResponse>builder()
                .code(HttpStatus.CREATED.value())
                .result(response)
                .build();
    }
}
