package com.uth.datalabeling.modules.iam.dto.request;

import jakarta.validation.constraints.Email;
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
public class LoginRequest {
  @Email(message = "INVALID_CREDENTIALS")
  @NotBlank(message = "MISSING_REQUIRED_FIELD")
  String email;

  @NotBlank(message = "MISSING_REQUIRED_FIELD")
  String password;
}
