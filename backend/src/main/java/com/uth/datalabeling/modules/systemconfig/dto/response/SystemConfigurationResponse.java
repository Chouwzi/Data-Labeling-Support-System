package com.uth.datalabeling.modules.systemconfig.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
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
public class SystemConfigurationResponse {
  @JsonProperty("max_image_file_size_mb")
  Integer maxImageFileSizeMb;

  @JsonProperty("ai_labeling_enabled")
  boolean aiLabelingEnabled;

  @JsonProperty("default_page_size")
  Integer defaultPageSize;

  @JsonProperty("allowed_image_extensions")
  List<String> allowedImageExtensions;

  @JsonProperty("updated_by")
  String updatedBy;

  @JsonProperty("updated_at")
  LocalDateTime updatedAt;
}
