package com.uth.datalabeling.modules.systemconfig.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
public class SystemConfigurationUpdateRequest {
  @NotNull(message = "MISSING_REQUIRED_FIELD")
  @Min(value = 1, message = "INVALID_MAX_IMAGE_FILE_SIZE")
  @Max(value = 100, message = "INVALID_MAX_IMAGE_FILE_SIZE")
  Integer maxImageFileSizeMb;

  @NotNull(message = "MISSING_REQUIRED_FIELD")
  Boolean aiLabelingEnabled; // Tính năng hỗ trợ gắn nhãn AI

  @NotNull(message = "MISSING_REQUIRED_FIELD")
  @Min(value = 5, message = "INVALID_DEFAULT_PAGE_SIZE")
  @Max(value = 200, message = "INVALID_DEFAULT_PAGE_SIZE")
  Integer defaultPageSize;

  @NotEmpty(message = "MISSING_REQUIRED_FIELD")
  @Size(min = 1, max = 10, message = "INVALID_ALLOWED_IMAGE_EXTENSIONS")
  List<String> allowedImageExtensions;
}
