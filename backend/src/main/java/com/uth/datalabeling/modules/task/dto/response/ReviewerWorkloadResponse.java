package com.uth.datalabeling.modules.task.dto.response;

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
public class ReviewerWorkloadResponse {
  UUID reviewerId;
  String reviewerName;
  String email;
  long pendingReview;
  long reviewed;
  long approved;
  long rejected;

  @JsonProperty("approval_rate")
  double approvalRate;

  @JsonProperty("rejection_rate")
  double rejectionRate;
}
