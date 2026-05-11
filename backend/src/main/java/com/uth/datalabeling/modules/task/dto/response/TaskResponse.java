package com.uth.datalabeling.modules.task.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TaskResponse {
    UUID id;
    UUID projectId;
    UUID annotatorId;
    String annotatorName;
    UUID sampleId;
    String imageUrl;
    String status;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
