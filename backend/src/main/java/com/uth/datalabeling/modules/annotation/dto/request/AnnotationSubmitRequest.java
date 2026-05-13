package com.uth.datalabeling.modules.annotation.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AnnotationSubmitRequest {

    @NotEmpty(message = "MISSING_REQUIRED_FIELD")
    List<Map<String, Object>> result;

    @JsonProperty("lead_time_seconds")
    @PositiveOrZero(message = "VALIDATION_ERROR")
    Integer leadTimeSeconds;
}
