package com.uth.datalabeling.modules.system.service;

import com.uth.datalabeling.modules.system.dto.request.SystemConfigUpdateRequest;
import com.uth.datalabeling.modules.system.dto.response.AuditLogResponse;
import com.uth.datalabeling.modules.system.dto.response.SystemConfigResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SystemService {

  // Mock data for demonstration - in real implementation, use database
  public List<SystemConfigResponse> getSystemConfigs() {
    return List.of(
        SystemConfigResponse.builder()
            .key("jwt.secret")
            .value("***")
            .description("JWT Secret Key")
            .updatedAt(LocalDateTime.now())
            .build(),
        SystemConfigResponse.builder()
            .key("jwt.expiration")
            .value("3600000")
            .description("JWT Token Expiration (ms)")
            .updatedAt(LocalDateTime.now())
            .build()
    );
  }

  public SystemConfigResponse updateSystemConfig(SystemConfigUpdateRequest request) {
    // Mock update - in real implementation, save to database
    return SystemConfigResponse.builder()
        .key(request.getKey())
        .value(request.getValue())
        .description("Updated config")
        .updatedAt(LocalDateTime.now())
        .build();
  }

  public List<AuditLogResponse> getAuditLogs() {
    return List.of(
        AuditLogResponse.builder()
            .id(1L)
            .action("USER_LOGIN")
            .userEmail("admin@example.com")
            .details("User logged in successfully")
            .timestamp(LocalDateTime.now().minusHours(1))
            .build(),
        AuditLogResponse.builder()
            .id(2L)
            .action("USER_CREATED")
            .userEmail("admin@example.com")
            .details("Created new user: annotator@example.com")
            .timestamp(LocalDateTime.now().minusHours(2))
            .build()
    );
  }
}