package com.uth.datalabeling.activitylog.repository;


import com.uth.datalabeling.activitylog.entity.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;


import java.util.UUID;


public interface ActivityLogRepository extends JpaRepository<ActivityLog, UUID> {
}



