package com.uth.datalabeling.activitylog.aspect;


import java.time.LocalDateTime;
import java.util.UUID;


import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;


import com.uth.datalabeling.activitylog.annotation.LogActivity;
import com.uth.datalabeling.activitylog.entity.ActivityLog;
import com.uth.datalabeling.activitylog.repository.ActivityLogRepository;
import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.modules.iam.repository.UserRepository;


import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;


import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;


import lombok.RequiredArgsConstructor;


@Aspect
@Component
@RequiredArgsConstructor
public class ActivityLogAspect {


    private final ActivityLogRepository repository;
    private final UserRepository userRepository;


    @Around("@annotation(logActivity)")
    public Object logActivity(ProceedingJoinPoint joinPoint, LogActivity logActivity) throws Throwable {


        long start = System.currentTimeMillis();


        ServletRequestAttributes attributes =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();


        HttpServletRequest request = attributes != null ? attributes.getRequest() : null;
        HttpServletResponse response = attributes != null ? attributes.getResponse() : null;


        Object result = null;
        int status = 200;


        try {


            result = joinPoint.proceed();


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


            // lấy userId
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();


            UUID userId = null;


            if (auth != null && auth.isAuthenticated()
                    && !"anonymousUser".equals(auth.getPrincipal())) {


                String email = auth.getName();


                userId = userRepository.findByEmail(email)
                        .map(user -> user.getId())
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


            ActivityLog log = ActivityLog.builder()
                    .userId(userId)
                    .action(logActivity.action())
                    .endpoint(endpoint)
                    .method(method)
                    .ipAddress(ipAddress)
                    .status(status)
                    .duration(duration)
                    .createdAt(LocalDateTime.now())
                    .build();


            repository.save(log);
        }


        return result;
    }
}

