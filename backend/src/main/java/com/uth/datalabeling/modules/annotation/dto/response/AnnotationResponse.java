package com.uth.datalabeling.modules.annotation.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.uth.datalabeling.modules.annotation.entity.AnnotationShapeType;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AnnotationResponse {
    UUID id;

    @JsonProperty("task_id")
    UUID taskId;

    @JsonProperty("shape_type")
    AnnotationShapeType shapeType;

    @JsonProperty("label_id")
    UUID labelId;

    @JsonProperty("label_name")
    String labelName;

    @JsonProperty("color_hex")
    String colorHex;

    Map<String, Object> geometry;

    @JsonProperty("is_ai_generated")
    Boolean isAiGenerated;

    @JsonProperty("created_at")
    LocalDateTime createdAt;

    @JsonProperty("updated_at")
    LocalDateTime updatedAt;
}
