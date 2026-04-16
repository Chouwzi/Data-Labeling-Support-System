package com.uth.datalabeling.modules.activitylog.controller;

import com.uth.datalabeling.common.response.ApiResponse;
import com.uth.datalabeling.modules.activitylog.annotation.LogActivity;
import com.uth.datalabeling.modules.activitylog.dto.ActivityLogResponse;
import com.uth.datalabeling.modules.activitylog.service.ActivityLogService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/audit-logs")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ActivityLogController {
    ActivityLogService service;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @LogActivity(action = "VIEW_AUDIT_LOGS")
    public ApiResponse<List<ActivityLogResponse>> getLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        List<ActivityLogResponse> logs = service.getLogs(page, size);

        return ApiResponse.<List<ActivityLogResponse>>builder()
                .result(logs)
                .build();
    }
}
