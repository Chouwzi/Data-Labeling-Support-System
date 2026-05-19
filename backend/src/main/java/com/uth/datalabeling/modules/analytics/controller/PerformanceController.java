package com.uth.datalabeling.modules.analytics.controller;

import com.uth.datalabeling.common.response.ApiResponse;
import com.uth.datalabeling.modules.analytics.dto.UserPerformanceResponse;
import com.uth.datalabeling.modules.analytics.service.PerformanceService;
import java.util.List;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PerformanceController {
  PerformanceService performanceService;

  @GetMapping("/admin/users/performance")
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<List<UserPerformanceResponse>> getAdminUserPerformance() {
    return ApiResponse.<List<UserPerformanceResponse>>builder()
        .result(performanceService.getVisibleUserPerformance())
        .build();
  }

  @GetMapping("/projects/{projectId}/performance")
  @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
  public ApiResponse<List<UserPerformanceResponse>> getProjectPerformance(@PathVariable UUID projectId) {
    return ApiResponse.<List<UserPerformanceResponse>>builder()
        .result(performanceService.getProjectPerformance(projectId))
        .build();
  }

  @GetMapping("/me/performance")
  @PreAuthorize("hasAnyRole('ANNOTATOR', 'REVIEWER')")
  public ApiResponse<UserPerformanceResponse> getMyPerformance() {
    return ApiResponse.<UserPerformanceResponse>builder()
        .result(performanceService.getMyPerformance())
        .build();
  }
}
