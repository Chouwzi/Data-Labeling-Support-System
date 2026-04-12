package com.uth.datalabeling.modules.activitylog.aspect;

import java.util.UUID;
import java.util.regex.Pattern;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.*;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.http.HttpStatus;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.modules.activitylog.annotation.LogActivity;
import com.uth.datalabeling.modules.activitylog.entity.ActivityLog;
import com.uth.datalabeling.modules.activitylog.repository.ActivityLogRepository;
import com.uth.datalabeling.modules.iam.entity.User;
import com.uth.datalabeling.modules.iam.repository.UserRepository;
import tools.jackson.databind.ObjectMapper;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
// Aspect này tự động ghi log khi method có @LogActivity được gọi.
public class ActivityLogAspect {

    ActivityLogRepository repository;
    UserRepository userRepository;
    ObjectMapper objectMapper;

    static final Pattern SENSITIVE_VALUE_PATTERN = Pattern.compile(
            "(?i)\\\"(password|token|accessToken|refreshToken|secret|authorization)\\\"\\s*:\\s*\\\"(.*?)\\\"");

    @Around("@annotation(logActivity)")
    public Object logActivity(ProceedingJoinPoint joinPoint, LogActivity logActivity) throws Throwable {

        long start = System.currentTimeMillis();

        // Lấy request/response hiện tại để ghi lại endpoint, method, status và IP.
        ServletRequestAttributes attributes = null;
        try {
            attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        } catch (IllegalStateException ignored) {
            // Không có request context (ví dụ: async/background), dùng giá trị fallback.
        }

        HttpServletRequest request = attributes != null ? attributes.getRequest() : null;
        HttpServletResponse response = attributes != null ? attributes.getResponse() : null;

        Object result = null;
        int status = 0;

        Object oldValue = null;
        Object newValue = null;
        UUID entityId = null;

        try {

            // Tìm entityId từ tham số method để biết log này đang liên quan đến bản ghi
            // nào.
            Object[] args = joinPoint.getArgs();
            String[] paramNames = ((MethodSignature) joinPoint.getSignature()).getParameterNames();
            entityId = extractEntityId(args, paramNames, logActivity.entityIdParam());

            // Chụp giá trị cũ trước khi xử lý để so sánh thay đổi sau cùng.
            if (entityId != null && !logActivity.entityType().isEmpty()) {
                oldValue = getOldEntity(logActivity.entityType(), entityId);
            }

            result = joinPoint.proceed();

            if (response != null) {
                status = response.getStatus();
            }

            // Chụp lại sau khi xử lý xong để lưu trạng thái mới của dữ liệu.
            if (entityId != null && !logActivity.entityType().isEmpty()) {
                newValue = getOldEntity(logActivity.entityType(), entityId);
            }

        } catch (AppException ex) {
            status = ex.getErrorCode().getHttpStatus();
            throw ex;

        } catch (Exception ex) {
            status = HttpStatus.INTERNAL_SERVER_ERROR.value();
            throw ex;

        } finally {

            long duration = System.currentTimeMillis() - start;

            if (response != null && status == 0) {
                status = response.getStatus();
            }

            if (status == 0) {
                status = HttpStatus.OK.value();
            }

            // Lấy user hiện tại từ Spring Security để biết ai thực hiện thao tác.
            UUID userId = null;
            try {
                Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                if (auth != null && auth.isAuthenticated()
                        && !"anonymousUser".equals(auth.getPrincipal())) {
                    String email = auth.getName();
                    userId = userRepository.findByEmail(email)
                            .map(User::getId)
                            .orElse(null);
                }
            } catch (Exception ignored) {
                // Không chặn luồng chính nếu không đọc được user từ security context.
            }

            String method = request != null ? request.getMethod() : "UNKNOWN";
            String endpoint = request != null ? request.getRequestURI() : "UNKNOWN";

            String ipAddress = null;

            if (request != null) {
                // Nếu chạy sau proxy/load balancer thì ưu tiên header X-Forwarded-For.
                ipAddress = request.getHeader("X-Forwarded-For");

                if (ipAddress == null || ipAddress.isEmpty()) {
                    ipAddress = request.getRemoteAddr();
                } else {
                    ipAddress = ipAddress.split(",")[0].trim();
                }

                if ("0:0:0:0:0:0:0:1".equals(ipAddress)) {
                    ipAddress = "127.0.0.1";
                }
            }

            String oldValueJson = null;
            String newValueJson = null;

            try {
                // Che các trường nhạy cảm trước khi lưu JSON vào log.
                if (oldValue != null) {
                    oldValueJson = sanitizeJson(objectMapper.writeValueAsString(oldValue));
                }
                if (newValue != null) {
                    newValueJson = sanitizeJson(objectMapper.writeValueAsString(newValue));
                }
            } catch (Exception ignored) {
                // Bỏ qua lỗi serialize để không làm ảnh hưởng request chính.
            }

            ActivityLog activityLog = ActivityLog.builder()
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
                    .build();

            try {
                repository.save(activityLog);
            } catch (Exception ex) {
                log.error("Failed to persist activity log for action: {}, endpoint: {}", logActivity.action(), endpoint,
                        ex);
            }
        }

        return result;
    }

    private UUID extractEntityId(Object[] args, String[] paramNames, String entityIdParam) {

        if (entityIdParam == null || entityIdParam.isBlank() || paramNames == null) {
            return null;
        }

        for (int i = 0; i < paramNames.length; i++) {
            if (!entityIdParam.equals(paramNames[i])) {
                continue;
            }

            Object value = args[i];
            if (value == null) {
                return null;
            }

            if (value instanceof UUID uuid) {
                return uuid;
            }

            if (value instanceof String textValue) {
                try {
                    return UUID.fromString(textValue);
                } catch (IllegalArgumentException ex) {
                    return null;
                }
            }
        }

        return null;
    }

    private String sanitizeJson(String rawJson) {
        if (rawJson == null || rawJson.isBlank()) {
            return rawJson;
        }
        // Thay password/token/secret bằng giá trị ẩn để tránh lộ dữ liệu nhạy cảm.
        return SENSITIVE_VALUE_PATTERN.matcher(rawJson).replaceAll("\"$1\":\"***\"");
    }

    private Object getOldEntity(String entityType, UUID id) {

        // Hiện tại chỉ hỗ trợ user; có thể mở rộng thêm các entity khác khi cần audit.
        switch (entityType) {

            case "USER":
                return userRepository.findById(id).orElse(null);

            default:
                return null;
        }
    }
}