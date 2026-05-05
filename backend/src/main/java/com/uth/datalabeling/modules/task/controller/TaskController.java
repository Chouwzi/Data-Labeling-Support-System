package com.uth.datalabeling.modules.task.controller;

import com.uth.datalabeling.modules.task.dto.response.TaskProgressResponse;
import com.uth.datalabeling.modules.task.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @GetMapping("/progress/{projectId}")
    public TaskProgressResponse getProgress(@PathVariable UUID projectId) {
        return taskService.getProgress(projectId);
    }
}