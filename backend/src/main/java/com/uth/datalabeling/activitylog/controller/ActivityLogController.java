package com.uth.datalabeling.activitylog.controller;

import com.uth.datalabeling.activitylog.dto.ActivityLogResponse;
import com.uth.datalabeling.activitylog.service.ActivityLogService;
import com.uth.datalabeling.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/audit-logs")
@RequiredArgsConstructor
public class ActivityLogController {

    private final ActivityLogService service;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public String getLogs() {
    return "ok";
}
}