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
public class DashboardPersonMetricResponse {
    UUID userId;
    String name;
    String email;
    String role;
    long assigned;
    long inProgress;
    long pendingReview;
    long completed;
    long rejected;
    long total;
    double completionRate;
    double rejectionRate;
}
