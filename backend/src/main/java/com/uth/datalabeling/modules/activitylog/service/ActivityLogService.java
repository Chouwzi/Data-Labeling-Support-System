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
import com.uth.datalabeling.modules.iam.entity.User;
import com.uth.datalabeling.modules.iam.repository.UserRepository;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ActivityLogService {

        ActivityLogRepository repository;
        UserRepository userRepository;

        public List<ActivityLogResponse> getLogs(int page, int size) {

                // Sắp xếp log mới nhất lên trước để màn hình audit dễ theo dõi.
                Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

                List<ActivityLog> logs = repository.findAll(pageable)
                                .getContent();
                Map<UUID, User> usersById = loadUsersById(logs);

                return logs
                                .stream()
                                .map(log -> toResponse(log, usersById.get(log.getUserId())))
                                .toList();
        }

        private Map<UUID, User> loadUsersById(List<ActivityLog> logs) {
                List<UUID> userIds = logs.stream()
                                .map(ActivityLog::getUserId)
                                .filter(Objects::nonNull)
                                .distinct()
                                .toList();

                if (userIds.isEmpty()) {
                        return Map.of();
                }

                return userRepository.findAllById(userIds)
                                .stream()
                                .collect(Collectors.toMap(User::getId, Function.identity()));
        }

        private ActivityLogResponse toResponse(ActivityLog log, User user) {

                // Tách entity sang DTO để API không phụ thuộc trực tiếp vào cấu trúc bảng.
                return ActivityLogResponse.builder()
                                .userId(log.getUserId())
                                .userEmail(user != null ? user.getEmail() : null)
                                .userFullName(user != null ? user.getFullName() : null)
                                .userRole(user != null ? user.getRole() : null)
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
