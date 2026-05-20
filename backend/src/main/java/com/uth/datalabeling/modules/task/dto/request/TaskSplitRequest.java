package com.uth.datalabeling.modules.task.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.Map;
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
public class TaskSplitRequest {
  @NotNull(message = "MISSING_REQUIRED_FIELD")
  String mode;

  @NotEmpty(message = "MISSING_REQUIRED_FIELD")
  @JsonProperty("annotator_ids")
  List<UUID> annotatorIds;

  @JsonProperty("percentages")
  Map<UUID, Integer> percentages;
}
