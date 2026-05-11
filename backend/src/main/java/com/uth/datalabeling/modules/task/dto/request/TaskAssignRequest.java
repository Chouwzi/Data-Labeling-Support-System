package com.uth.datalabeling.modules.task.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;
import java.util.UUID;

/**
 * Request để phân bổ danh sách công việc cho một người gắn nhãn.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TaskAssignRequest {
    @NotEmpty(message = "TASK_IDS_REQUIRED")
    List<UUID> taskIds; // Danh sách ID các công việc cần phân bổ

    @NotNull(message = "ANNOTATOR_ID_REQUIRED")
    UUID annotatorId; // ID của người gắn nhãn (Annotator)
}
