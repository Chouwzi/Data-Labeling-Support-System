package com.uth.datalabeling.modules.project.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
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
public class ProjectTaskStatsResponse {
  long total;
  long unlabeled;
  long inProgress;
  long pendingReview;
  long completed;
  long rejected;

  @JsonProperty("completion_rate")
  double completionRate;

  @JsonProperty("rejection_rate")
  double rejectionRate;
}
