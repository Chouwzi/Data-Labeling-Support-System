package com.uth.datalabeling.activitylog.aspect;

import java.time.LocalDateTime;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import com.uth.datalabeling.activitylog.annotation.LogActivity;
import com.uth.datalabeling.activitylog.entity.ActivityLog;
import com.uth.datalabeling.activitylog.repository.ActivityLogRepository;

import lombok.RequiredArgsConstructor;

@Aspect
@Component
@RequiredArgsConstructor
public class ActivityLogAspect {

    private final ActivityLogRepository repository;

    @AfterReturning("@annotation(logActivity)")
    public void logActivity(JoinPoint joinPoint, LogActivity logActivity) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        Long userId = null;

        if (auth != null) {
            userId = 1L;
        }

        ActivityLog log = ActivityLog.builder()
                .userId(userId)
                .action(logActivity.action())
                .endpoint(joinPoint.getSignature().getName())
                .createdAt(LocalDateTime.now())
                .build();

        repository.save(log);
    }
}