package com.uth.datalabeling.modules.dashboard.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ManagerDashboardResponse {
    DashboardSummaryResponse summary;
    List<TaskPipelineItemResponse> taskPipeline;
    List<ProjectHealthResponse> projectHealth;
    QualitySnapshotResponse qualitySnapshot;
    List<DashboardPersonMetricResponse> topAnnotators;
    List<DashboardAttentionItemResponse> attentionQueue;
    List<RecentActivityResponse> recentActivity;
}
