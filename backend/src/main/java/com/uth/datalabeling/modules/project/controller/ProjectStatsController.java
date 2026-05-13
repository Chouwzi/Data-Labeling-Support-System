package com.uth.datalabeling.modules.project.controller;

import com.uth.datalabeling.common.response.ApiResponse;
import com.uth.datalabeling.modules.project.dto.response.ProjectStatsResponse;
import com.uth.datalabeling.modules.project.service.ProjectStatsService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/projects/{projectId}/statistics")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProjectStatsController {

    ProjectStatsService projectStatsService;

    @Operation(summary = "Lấy thống kê tiến độ của dự án", 
               description = "Trả về tổng số task, task đã hoàn thành, task chờ xử lý và phần trăm hoàn thành.")
    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ApiResponse<ProjectStatsResponse> getProjectStatistics(@PathVariable UUID projectId) {
        ProjectStatsResponse stats = projectStatsService.getProjectStatistics(projectId);
        return ApiResponse.<ProjectStatsResponse>builder().result(stats).build();
    }
}
