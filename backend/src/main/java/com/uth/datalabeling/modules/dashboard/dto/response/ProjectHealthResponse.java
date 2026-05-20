package com.uth.datalabeling.modules.dashboard.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProjectHealthResponse {
    UUID id;
    String name;
    UUID datasetId;
    long imageCount;
    long labelCount;
    long totalTasks;
    long pendingReview;
    long rejected;
    double completionRate;
    double rejectionRate;
    String readinessState;
    String nextAction;
}
