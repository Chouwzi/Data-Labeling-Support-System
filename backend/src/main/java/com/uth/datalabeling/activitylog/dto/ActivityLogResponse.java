package com.uth.datalabeling.activitylog.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;
import java.time.LocalDateTime;

@Data
@Builder
public class ActivityLogResponse {

    private String action;

    private String endpoint;

    private String method;

    private Integer status;

    private String ipAddress;

    private UUID userId;

    private Long durationMs;

    private UUID entityId;
    private String entityType;
    private String oldValue;
    private String newValue;

    private LocalDateTime createdAt;
}