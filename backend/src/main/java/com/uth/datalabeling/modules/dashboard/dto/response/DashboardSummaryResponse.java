package com.uth.datalabeling.modules.dashboard.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DashboardSummaryResponse {
    long totalProjects;
    long datasetImages;
    long totalTasks;
    long unassigned;
    long assigned;
    long inProgress;
    long readyForReview;
    long pendingReview;
    long completed;
    long rejected;
    double completionRate;
    double rejectionRate;

    long totalUsers;
    long activeUsers;
    long inactiveUsers;
    long totalDatasets;
    long setupGaps;
    long activeLabelingTasks;
}
