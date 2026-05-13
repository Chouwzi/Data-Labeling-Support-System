package com.uth.datalabeling.modules.annotation.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.AssertTrue;
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

    List<Map<String, Object>> result;

    @JsonProperty("is_null")
    Boolean isNull;

    @JsonProperty("lead_time_seconds")
    @PositiveOrZero(message = "VALIDATION_ERROR")
    Integer leadTimeSeconds;

    @AssertTrue(message = "MISSING_REQUIRED_FIELD")
    public boolean isResultOrNullImageProvided() {
        return Boolean.TRUE.equals(isNull) || (result != null && !result.isEmpty());
    }
}
