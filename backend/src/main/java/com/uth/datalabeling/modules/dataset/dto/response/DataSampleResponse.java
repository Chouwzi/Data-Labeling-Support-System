package com.uth.datalabeling.modules.dataset.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DataSampleResponse {
    UUID id;
    UUID datasetId;
    String imageUrl;
    Map<String, Object> metadata;
    LocalDateTime createdAt;
}
