package com.uth.datalabeling.modules.activitylog.dto;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ActivityLogResponseTest {

  @Test
  void builder_ShouldSetAllFields() {
    UUID userId = UUID.randomUUID();
    UUID entityId = UUID.randomUUID();
    LocalDateTime createdAt = LocalDateTime.of(2026, 4, 11, 10, 30);

    ActivityLogResponse response = ActivityLogResponse.builder()
        .action("VIEW_AUDIT_LOGS")
        .endpoint("/api/v1/audit-logs")
        .method("GET")
        .status(200)
        .ipAddress("127.0.0.1")
        .userId(userId)
        .durationMs(12L)
        .entityId(entityId)
        .entityType("USER")
        .oldValue("old")
        .newValue("new")
        .createdAt(createdAt)
        .build();

    assertEquals("VIEW_AUDIT_LOGS", response.getAction());
    assertEquals("/api/v1/audit-logs", response.getEndpoint());
    assertEquals("GET", response.getMethod());
    assertEquals(200, response.getStatus());
    assertEquals("127.0.0.1", response.getIpAddress());
    assertEquals(userId, response.getUserId());
    assertEquals(12L, response.getDurationMs());
    assertEquals(entityId, response.getEntityId());
    assertEquals("USER", response.getEntityType());
    assertEquals("old", response.getOldValue());
    assertEquals("new", response.getNewValue());
    assertEquals(createdAt, response.getCreatedAt());
  }
}