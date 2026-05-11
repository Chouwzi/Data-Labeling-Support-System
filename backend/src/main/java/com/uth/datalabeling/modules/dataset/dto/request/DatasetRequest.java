package com.uth.datalabeling.modules.dataset.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DatasetRequest {
    @NotBlank(message = "NAME_REQUIRED")
    String name;
    String description;
}
