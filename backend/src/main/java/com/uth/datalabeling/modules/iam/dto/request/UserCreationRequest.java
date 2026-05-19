package com.uth.datalabeling.modules.iam.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserCreationRequest {
  @NotBlank(message = "MISSING_REQUIRED_FIELD")
  @Email(message = "INVALID_CREDENTIALS")
  String email;

  @NotBlank(message = "MISSING_REQUIRED_FIELD")
  @JsonProperty("full_name")
  String fullName;

  @NotBlank(message = "MISSING_REQUIRED_FIELD")
  @Size(min = 8, message = "PASSWORD_TOO_SHORT")
  String password;

  @NotBlank(message = "MISSING_REQUIRED_FIELD")
  @Pattern(regexp = "^(ADMIN|MANAGER|ANNOTATOR|REVIEWER)$", message = "VALIDATION_ERROR")
  @Size(max = 50)
  String role;

  @Builder.Default
  boolean active = true;

  @JsonProperty("group_id")
  UUID groupId;
}
