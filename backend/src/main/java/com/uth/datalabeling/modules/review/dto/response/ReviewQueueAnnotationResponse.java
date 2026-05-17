package com.uth.datalabeling.modules.review.dto.response;

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
public class ReviewQueueAnnotationResponse {
    UUID id;
    UUID labelId;
    String labelName;
    String colorHex;
    String shapeType;
    Map<String, Object> geometry;
    Boolean isAiGenerated;
}
