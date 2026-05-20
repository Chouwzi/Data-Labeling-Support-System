package com.uth.datalabeling.modules.iam.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
public class UserGroupRequest {
  @NotBlank(message = "MISSING_REQUIRED_FIELD")
  @Size(min = 2, max = 100, message = "VALIDATION_ERROR")
  String name;

  @Size(max = 500, message = "VALIDATION_ERROR")
  String description;

  @JsonProperty("manager_id")
  UUID managerId;
}
