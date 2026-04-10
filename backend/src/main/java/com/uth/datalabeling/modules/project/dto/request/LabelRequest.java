package com.uth.datalabeling.modules.project.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LabelRequest {
    @NotBlank(message = "MISSING_REQUIRED_FIELD")
    String name;

    @NotBlank(message = "MISSING_REQUIRED_FIELD")
    @Pattern(regexp = "^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$", message = "VALIDATION_ERROR")
    String colorHex;
}
