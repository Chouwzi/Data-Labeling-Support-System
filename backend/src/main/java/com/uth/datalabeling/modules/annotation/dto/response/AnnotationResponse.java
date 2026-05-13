package com.uth.datalabeling.modules.annotation.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AnnotationResponse {
    UUID id;
    UUID taskId;
    UUID annotatorId;
    String status;
    List<Map<String, Object>> result;
    Boolean isNull;
    Integer leadTimeSeconds;
    LocalDateTime submittedAt;
}
