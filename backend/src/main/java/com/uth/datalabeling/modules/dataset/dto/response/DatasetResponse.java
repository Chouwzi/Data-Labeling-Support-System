package com.uth.datalabeling.modules.dataset.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DatasetResponse {
    UUID id;
    String name;
    String description;
    UUID creatorId;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
