package com.uth.datalabeling.activitylog.filter;

import com.uth.datalabeling.activitylog.entity.ActivityLog;
import com.uth.datalabeling.activitylog.repository.ActivityLogRepository;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;

@Component
public class ActivityLogFilter extends OncePerRequestFilter {

    @Autowired
    private ActivityLogRepository repository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        filterChain.doFilter(request, response);

        String method = request.getMethod();

        if (!method.equals("POST") && !method.equals("PUT") && !method.equals("DELETE"))
            return;

        ActivityLog log = new ActivityLog();

        log.setAction("API_CALL");
        log.setEndpoint(request.getRequestURI());
        log.setMethod(method);
        log.setStatus(response.getStatus());
        log.setIpAddress(request.getRemoteAddr());
        log.setCreatedAt(LocalDateTime.now());

        repository.save(log);
    }
}