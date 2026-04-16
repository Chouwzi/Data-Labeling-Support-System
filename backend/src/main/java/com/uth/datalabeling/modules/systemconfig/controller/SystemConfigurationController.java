package com.uth.datalabeling.modules.systemconfig.controller;

import com.uth.datalabeling.common.response.ApiResponse;
import com.uth.datalabeling.modules.activitylog.annotation.LogActivity;
import com.uth.datalabeling.modules.systemconfig.dto.request.SystemConfigurationUpdateRequest;
import com.uth.datalabeling.modules.systemconfig.dto.response.SystemConfigurationResponse;
import com.uth.datalabeling.modules.systemconfig.service.SystemConfigurationService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/system-config")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SystemConfigurationController {
  SystemConfigurationService systemConfigurationService;

  @GetMapping
  @LogActivity(action = "VIEW_SYSTEM_CONFIG")
  public ApiResponse<SystemConfigurationResponse> getConfiguration() {
    return ApiResponse.<SystemConfigurationResponse>builder()
        .result(systemConfigurationService.getConfiguration())
        .build();
  }

  @PutMapping
  @PreAuthorize("hasRole('ADMIN')")
  @LogActivity(action = "UPDATE_SYSTEM_CONFIG")
  public ApiResponse<SystemConfigurationResponse> updateConfiguration(
      @Valid @RequestBody SystemConfigurationUpdateRequest request,
      Authentication authentication) {
    String updatedBy = authentication == null ? "system" : authentication.getName();

    return ApiResponse.<SystemConfigurationResponse>builder()
        .message("Đã cập nhật cấu hình hệ thống")
        .result(systemConfigurationService.updateConfiguration(request, updatedBy))
        .build();
  }
}
