package com.uth.datalabeling.modules.task.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
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
public class ProjectWorkloadResponse {
  long unassigned;
  long assigned;
  long inProgress;
  long pendingReview;
  long completed;
  long rejected;
  long total;

  @JsonProperty("annotators")
  List<AnnotatorWorkloadResponse> annotators;

  @JsonProperty("reviewers")
  List<ReviewerWorkloadResponse> reviewers;
}
