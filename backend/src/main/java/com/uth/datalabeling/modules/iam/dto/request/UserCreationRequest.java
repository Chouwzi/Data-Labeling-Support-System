package com.uth.datalabeling.modules.iam.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
public class UserCreationRequest {
  @NotBlank(message = "MISSING_REQUIRED_FIELD")
  @Email(message = "INVALID_CREDENTIALS")
  String email;

  @NotBlank(message = "MISSING_REQUIRED_FIELD")
  String fullName;

  @Size(min = 8, message = "PASSWORD_TOO_SHORT")
  String password;

  @NotBlank(message = "MISSING_REQUIRED_FIELD")
  @Size(max = 50)
  String role;

  @Builder.Default
  boolean active = true;
}
