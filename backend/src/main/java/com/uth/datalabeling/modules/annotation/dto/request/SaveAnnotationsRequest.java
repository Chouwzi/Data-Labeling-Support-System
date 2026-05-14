package com.uth.datalabeling.modules.annotation.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SaveAnnotationsRequest {

    @NotNull(message = "MISSING_REQUIRED_FIELD")
    @Valid
    List<AnnotationItemRequest> annotations;

    @Builder.Default
    Boolean submit = false;
}
