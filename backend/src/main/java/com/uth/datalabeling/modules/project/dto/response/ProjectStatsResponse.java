package com.uth.datalabeling.modules.project.dto.response;

import java.util.Map;

public record ProjectStatsResponse(
        Long totalTasks,
        Long completedTasks,
        Long pendingTasks,
        Double completionPercentage,
        Map<String, Long> statusDistribution
) {
}
