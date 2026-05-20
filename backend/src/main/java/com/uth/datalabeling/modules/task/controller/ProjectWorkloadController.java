package com.uth.datalabeling.modules.task.controller;

import com.uth.datalabeling.common.response.ApiResponse;
import com.uth.datalabeling.modules.task.dto.response.ProjectWorkloadResponse;
import com.uth.datalabeling.modules.task.service.TaskService;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/projects/{projectId}/workload")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProjectWorkloadController {
  TaskService taskService;

  @GetMapping
  @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
  public ApiResponse<ProjectWorkloadResponse> getWorkload(@PathVariable UUID projectId) {
    return ApiResponse.<ProjectWorkloadResponse>builder()
        .result(taskService.getProjectWorkload(projectId))
        .build();
  }
}
