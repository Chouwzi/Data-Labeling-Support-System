package com.uth.datalabeling.modules.system.dto.request;

import jakarta.validation.constraints.NotBlank;
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
public class SystemConfigUpdateRequest {
  @NotBlank(message = "MISSING_REQUIRED_FIELD")
  String key;

  @NotBlank(message = "MISSING_REQUIRED_FIELD")
  String value;
}