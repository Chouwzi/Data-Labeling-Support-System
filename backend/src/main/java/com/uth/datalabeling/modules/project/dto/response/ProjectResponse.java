package com.uth.datalabeling.modules.project.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

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
    String guidelineUrl;
    String status;
    UUID managerId;
    UUID datasetId;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
    List<LabelResponse> labels;
}
