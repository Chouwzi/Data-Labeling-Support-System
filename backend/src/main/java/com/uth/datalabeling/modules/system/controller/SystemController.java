package com.uth.datalabeling.modules.system.controller;

import com.uth.datalabeling.common.response.ApiResponse;
import com.uth.datalabeling.modules.system.dto.request.SystemConfigUpdateRequest;
import com.uth.datalabeling.modules.system.dto.response.AuditLogResponse;
import com.uth.datalabeling.modules.system.dto.response.SystemConfigResponse;
import com.uth.datalabeling.modules.system.service.SystemService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/system")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SystemController {
  SystemService systemService;

  @GetMapping("/configs")
  public ApiResponse<List<SystemConfigResponse>> getSystemConfigs() {
    return ApiResponse.<List<SystemConfigResponse>>builder()
        .data(systemService.getSystemConfigs())
        .build();
  }

  @PutMapping("/configs")
  public ApiResponse<SystemConfigResponse> updateSystemConfig(@Valid @RequestBody SystemConfigUpdateRequest request) {
    return ApiResponse.<SystemConfigResponse>builder()
        .data(systemService.updateSystemConfig(request))
        .message("System config updated successfully")
        .build();
  }

  @GetMapping("/audit-logs")
  public ApiResponse<List<AuditLogResponse>> getAuditLogs() {
    return ApiResponse.<List<AuditLogResponse>>builder()
        .data(systemService.getAuditLogs())
        .build();
  }
}