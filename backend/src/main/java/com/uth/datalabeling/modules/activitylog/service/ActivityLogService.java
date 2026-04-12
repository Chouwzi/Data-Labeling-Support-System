package com.uth.datalabeling.modules.activitylog.service;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.uth.datalabeling.modules.activitylog.dto.ActivityLogResponse;
import com.uth.datalabeling.modules.activitylog.entity.ActivityLog;
import com.uth.datalabeling.modules.activitylog.repository.ActivityLogRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ActivityLogService {

        ActivityLogRepository repository;

        public List<ActivityLogResponse> getLogs(int page, int size) {

                // Sắp xếp log mới nhất lên trước để màn hình audit dễ theo dõi.
                Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

                return repository.findAll(pageable)
                                .getContent()
                                .stream()
                                .map(this::toResponse)
                                .toList();
        }

        private ActivityLogResponse toResponse(ActivityLog log) {

                // Tách entity sang DTO để API không phụ thuộc trực tiếp vào cấu trúc bảng.
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