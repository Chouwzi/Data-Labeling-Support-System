package com.uth.datalabeling.modules.project.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LabelResponse {
    UUID id;
    String name;
    String colorHex;
    UUID parentId;
    LocalDateTime createdAt;
}
