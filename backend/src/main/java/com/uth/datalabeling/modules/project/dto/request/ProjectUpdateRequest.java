package com.uth.datalabeling.modules.project.dto.request;

import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * Yêu cầu cập nhật Dự án.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProjectUpdateRequest {
    @Size(min = 3, max = 100, message = "INVALID_PROJECT_NAME")
    String name;

    @Size(max = 500, message = "INVALID_DESCRIPTION")
    String description;

    @JsonProperty("guideline_url")
    String guidelineUrl;

    @JsonProperty("dataset_id")
    UUID datasetId;

    @Pattern(regexp = "^(DRAFT|ACTIVE|ARCHIVED)$", message = "INVALID_PROJECT_STATUS")
    String status;

    @Valid
    List<LabelRequest> labels;
}
