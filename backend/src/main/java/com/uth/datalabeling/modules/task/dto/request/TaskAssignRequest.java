package com.uth.datalabeling.modules.task.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TaskAssignRequest {
    @NotEmpty(message = "TASK_IDS_REQUIRED")
    List<UUID> taskIds;

    @NotNull(message = "ANNOTATOR_ID_REQUIRED")
    UUID annotatorId;
}
