package com.uth.datalabeling.modules.annotation.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.uth.datalabeling.modules.annotation.entity.AnnotationShapeType;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.util.Map;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AnnotationItemRequest {

    @NotNull(message = "MISSING_REQUIRED_FIELD")
    @JsonProperty("shape_type")
    AnnotationShapeType shapeType;

    @NotNull(message = "MISSING_REQUIRED_FIELD")
    @JsonProperty("label_id")
    UUID labelId;

    @NotNull(message = "MISSING_REQUIRED_FIELD")
    Map<String, Object> geometry;

    @JsonProperty("is_ai_generated")
    Boolean isAiGenerated;

    @AssertTrue(message = "VALIDATION_ERROR")
    public boolean isGeometryObjectNotEmpty() {
        return geometry != null && !geometry.isEmpty();
    }
}
