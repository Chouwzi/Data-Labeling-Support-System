package com.uth.datalabeling.modules.systemconfig.dto.response;

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
  Integer maxImageFileSizeMb;
  boolean aiLabelingEnabled;
  Integer defaultPageSize;
  List<String> allowedImageExtensions;
  String updatedBy;
  LocalDateTime updatedAt;
}
