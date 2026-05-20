package com.uth.datalabeling.modules.project.service;

import com.uth.datalabeling.modules.project.dto.response.ProjectStatsResponse;
import com.uth.datalabeling.modules.task.dto.TaskStatusCountDTO;
import com.uth.datalabeling.modules.task.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectStatsService {

    private final TaskRepository taskRepository;
    private final ProjectAccessService projectAccessService;

    @Transactional(readOnly = true)
    public ProjectStatsResponse getProjectStatistics(UUID projectId) {
        projectAccessService.findProjectAndCheckAccess(projectId, true);

        List<TaskStatusCountDTO> statusCounts = taskRepository.countTasksByStatus(projectId);

        Map<String, Long> statusDistribution = statusCounts.stream()
                .collect(Collectors.toMap(TaskStatusCountDTO::status, TaskStatusCountDTO::count));

        long totalTasks = statusCounts.stream().mapToLong(TaskStatusCountDTO::count).sum();
        long completedTasks = statusDistribution.getOrDefault("DONE", 0L);
        long pendingTasks = statusDistribution.getOrDefault("PENDING", 0L);

        double completionPercentage = 0.0;
        if (totalTasks > 0) {
            completionPercentage = ((double) completedTasks / totalTasks) * 100.0;
            completionPercentage = Math.round(completionPercentage * 100.0) / 100.0;
        }

        return new ProjectStatsResponse(
                totalTasks,
                completedTasks,
                pendingTasks,
                completionPercentage,
                statusDistribution
        );
    }
}
