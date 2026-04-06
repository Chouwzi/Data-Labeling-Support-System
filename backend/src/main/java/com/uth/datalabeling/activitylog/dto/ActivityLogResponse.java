package com.uth.datalabeling.activitylog.dto;

import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
@Data
@Builder
@Getter
@Setter
public class ActivityLogResponse {
    private String action;
    private String endpoint;
    private String method;
    private Integer status;
    private String ipAddress;
    private LocalDateTime createdAt;
    private Long userId;
}