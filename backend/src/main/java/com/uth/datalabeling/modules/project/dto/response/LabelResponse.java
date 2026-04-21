package com.uth.datalabeling.modules.project.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonProperty;

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

    @JsonProperty("color_hex")
    String colorHex;

    @JsonProperty("created_at")
    LocalDateTime createdAt;
}
