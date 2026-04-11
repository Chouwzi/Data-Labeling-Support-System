package com.uth.datalabeling.modules.activitylog.aspect;

import java.time.LocalDateTime;
import java.util.UUID;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.*;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.modules.activitylog.annotation.LogActivity;
import com.uth.datalabeling.modules.activitylog.entity.ActivityLog;
import com.uth.datalabeling.modules.activitylog.repository.ActivityLogRepository;
import com.uth.datalabeling.modules.iam.entity.User;
import com.uth.datalabeling.modules.iam.repository.UserRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Aspect
@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ActivityLogAspect {

    ActivityLogRepository repository;
    UserRepository userRepository;
    ObjectMapper objectMapper = new ObjectMapper()
            .findAndRegisterModules();

    @Around("@annotation(logActivity)")
    public Object logActivity(ProceedingJoinPoint joinPoint, LogActivity logActivity) throws Throwable {

        long start = System.currentTimeMillis();

        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();

        HttpServletRequest request = attributes != null ? attributes.getRequest() : null;
        HttpServletResponse response = attributes != null ? attributes.getResponse() : null;

        Object result = null;
        int status = 200;

        Object oldValue = null;
        Object newValue = null;
        UUID entityId = null;

        try {

            // LẤY entityId từ param
            Object[] args = joinPoint.getArgs();
            String[] paramNames = ((MethodSignature) joinPoint.getSignature()).getParameterNames();

            for (int i = 0; i < paramNames.length; i++) {
                if (paramNames[i].equals(logActivity.entityIdParam())) {
                    entityId = (UUID) args[i];
                    break;
                }
            }

            // LẤY giá trị cũ (Old value)
            if (entityId != null && !logActivity.entityType().isEmpty()) {
                oldValue = getOldEntity(logActivity.entityType(), entityId);
            }

            result = joinPoint.proceed();

            // LẤY NEW VALUE
            if (entityId != null && !logActivity.entityType().isEmpty()) {
                newValue = getOldEntity(logActivity.entityType(), entityId);
            }

        } catch (AppException ex) {
            status = 401;
            throw ex;

        } catch (Exception ex) {
            status = 500;
            throw ex;

        } finally {

            long duration = System.currentTimeMillis() - start;

            if (response != null && status == 200) {
                status = response.getStatus();
            }

            // USER ID
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();

            UUID userId = null;

            if (auth != null && auth.isAuthenticated()
                    && !"anonymousUser".equals(auth.getPrincipal())) {

                String email = auth.getName();

                userId = userRepository.findByEmail(email)
                        .map(User::getId)
                        .orElse(null);
            }

            String method = request != null ? request.getMethod() : null;
            String endpoint = request != null ? request.getRequestURI() : null;

            String ipAddress = null;

            if (request != null) {
                ipAddress = request.getHeader("X-Forwarded-For");

                if (ipAddress == null || ipAddress.isEmpty()) {
                    ipAddress = request.getRemoteAddr();
                }

                if ("0:0:0:0:0:0:0:1".equals(ipAddress)) {
                    ipAddress = "127.0.0.1";
                }
            }

            String oldValueJson = null;
            String newValueJson = null;

            try {
                if (oldValue != null) {
                    oldValueJson = objectMapper.writeValueAsString(oldValue);
                }
                if (newValue != null) {
                    newValueJson = objectMapper.writeValueAsString(newValue);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }

            ActivityLog log = ActivityLog.builder()
                    .userId(userId)
                    .action(logActivity.action())
                    .endpoint(endpoint)
                    .method(method)
                    .ipAddress(ipAddress)
                    .status(status)
                    .durationMs(duration)
                    .entityId(entityId)
                    .entityType(logActivity.entityType())
                    .oldValue(oldValueJson)
                    .newValue(newValueJson)
                    .createdAt(LocalDateTime.now())
                    .build();

            repository.save(log);
        }

        return result;
    }

    private Object getOldEntity(String entityType, UUID id) {

        switch (entityType) {

            case "USER":
                return userRepository.findById(id).orElse(null);

            default:
                return null;
        }
    }
}