package com.uth.datalabeling.modules.analytics.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.UUID;
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
public class UserPerformanceResponse {
  UUID userId;
  String fullName;
  String email;
  String role;

  @JsonProperty("group_id")
  UUID groupId;

  @JsonProperty("group_name")
  String groupName;

  long assigned;
  long inProgress;
  long pendingReview;
  long completed;
  long rejected;
  long reviewed;
  long pendingToReview;

  @JsonProperty("completion_rate")
  double completionRate;

  @JsonProperty("approval_rate")
  double approvalRate;

  @JsonProperty("rejection_rate")
  double rejectionRate;
}
