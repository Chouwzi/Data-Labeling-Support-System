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
public class AnnotatorWorkloadResponse {
  UUID annotatorId;
  String annotatorName;
  String email;
  long assigned;
  long inProgress;
  long pendingReview;
  long completed;
  long rejected;
  long total;

  @JsonProperty("completion_rate")
  double completionRate;

  @JsonProperty("rejection_rate")
  double rejectionRate;
}
