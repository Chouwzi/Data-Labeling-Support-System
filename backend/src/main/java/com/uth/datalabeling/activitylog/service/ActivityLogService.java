package com.uth.datalabeling.activitylog.service;

import com.uth.datalabeling.activitylog.dto.ActivityLogResponse;
import com.uth.datalabeling.activitylog.entity.ActivityLog;
import com.uth.datalabeling.activitylog.repository.ActivityLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ActivityLogService {

    private final ActivityLogRepository repository;

    public List<ActivityLogResponse> getAllLogs() {
        return repository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    private ActivityLogResponse toResponse(ActivityLog log) {
        return ActivityLogResponse.builder()
                .action(log.getAction())
                .endpoint(log.getEndpoint())
                .method(log.getMethod())
                .status(log.getStatus())
                .ipAddress(log.getIpAddress())
                .createdAt(log.getCreatedAt())
                .userId(log.getUserId())
                .build();
    }
}