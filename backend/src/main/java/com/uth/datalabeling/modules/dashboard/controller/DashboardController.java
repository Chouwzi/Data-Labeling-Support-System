package com.uth.datalabeling.modules.dashboard.controller;

import com.uth.datalabeling.common.response.ApiResponse;
import com.uth.datalabeling.modules.dashboard.dto.response.AdminDashboardResponse;
import com.uth.datalabeling.modules.dashboard.dto.response.ManagerDashboardResponse;
import com.uth.datalabeling.modules.dashboard.service.DashboardService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DashboardController {
    DashboardService dashboardService;

    @GetMapping("/manager")
    @PreAuthorize("hasRole('MANAGER')")
    public ApiResponse<ManagerDashboardResponse> getManagerDashboard() {
        return ApiResponse.<ManagerDashboardResponse>builder()
                .result(dashboardService.getManagerDashboard())
                .build();
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<AdminDashboardResponse> getAdminDashboard() {
        return ApiResponse.<AdminDashboardResponse>builder()
                .result(dashboardService.getAdminDashboard())
                .build();
    }
}
