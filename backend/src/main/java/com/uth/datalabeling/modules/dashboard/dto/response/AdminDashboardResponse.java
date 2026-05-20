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
public class AdminDashboardResponse {
    DashboardSummaryResponse summary;
    List<DashboardBreakdownItemResponse> roleBreakdown;
    List<TaskPipelineItemResponse> taskPipeline;
    List<DashboardBreakdownItemResponse> projectSetupBreakdown;
    List<AuditActivityPointResponse> auditActivity;
    List<DashboardAttentionItemResponse> attentionQueue;
    List<RecentActivityResponse> recentActivity;
}
