package com.uth.datalabeling.activitylog.service;

import com.uth.datalabeling.activitylog.dto.ActivityLogResponse;
import com.uth.datalabeling.activitylog.entity.ActivityLog;
import com.uth.datalabeling.activitylog.repository.ActivityLogRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ActivityLogService {

    private final ActivityLogRepository repository;

    public List<ActivityLogResponse> getLogs(int page, int size) {

        Pageable pageable =
                PageRequest.of(page, size, Sort.by("createdAt").descending());

        return repository.findAll(pageable)
                .getContent()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private ActivityLogResponse toResponse(ActivityLog log) {

    return ActivityLogResponse.builder()
            .userId(log.getUserId())
            .action(log.getAction())
            .endpoint(log.getEndpoint())
            .method(log.getMethod())
            .status(log.getStatus())
            .ipAddress(log.getIpAddress())

            .durationMs(log.getDurationMs())

            .entityId(log.getEntityId())
            .entityType(log.getEntityType())
            .oldValue(log.getOldValue())
            .newValue(log.getNewValue())

            .createdAt(log.getCreatedAt())
            .build();
    }
}