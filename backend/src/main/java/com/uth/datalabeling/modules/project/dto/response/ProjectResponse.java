package com.uth.datalabeling.modules.project.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProjectResponse {
    UUID id;

    String name;

    String description;

    @JsonProperty("guideline_url")
    String guidelineUrl;

    String status;

    @JsonProperty("manager_id")
    UUID managerId;

    @JsonProperty("dataset_id")
    UUID datasetId;

    @JsonProperty("created_at")
    LocalDateTime createdAt;

    @JsonProperty("updated_at")
    LocalDateTime updatedAt;

    List<LabelResponse> labels;
}
