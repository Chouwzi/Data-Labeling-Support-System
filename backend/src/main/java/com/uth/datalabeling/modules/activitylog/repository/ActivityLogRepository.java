package com.uth.datalabeling.modules.activitylog.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.uth.datalabeling.modules.activitylog.entity.ActivityLog;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, UUID> {
    List<ActivityLog> findTop5ByOrderByCreatedAtDesc();

    List<ActivityLog> findByCreatedAtAfter(LocalDateTime since);
}
