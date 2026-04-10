package com.uth.datalabeling.activitylog.controller;


import com.uth.datalabeling.activitylog.dto.ActivityLogResponse;
import com.uth.datalabeling.activitylog.service.ActivityLogService;
import com.uth.datalabeling.common.response.ApiResponse;
import com.uth.datalabeling.activitylog.annotation.LogActivity;


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

