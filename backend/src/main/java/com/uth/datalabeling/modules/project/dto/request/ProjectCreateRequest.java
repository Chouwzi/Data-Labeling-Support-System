package com.uth.datalabeling.modules.project.dto.request;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProjectCreateRequest {
    @NotBlank(message = "MISSING_REQUIRED_FIELD")
    @Size(min = 3, max = 100, message = "VALIDATION_ERROR")
    String name;

    String description;

    @Size(max = 500, message = "VALIDATION_ERROR")
    String guidelineUrl;

    UUID datasetId;

    @NotEmpty(message = "MISSING_REQUIRED_FIELD")
    @Valid
    List<LabelRequest> labels;
}
