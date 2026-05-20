package com.uth.datalabeling.modules.task.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.uth.datalabeling.modules.review.dto.response.ReviewQueueAnnotationResponse;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AssignedImageResponse {
    UUID taskId;
    UUID projectId;
    String projectName;
    UUID sampleId;
    String imageUrl;
    String status;
    LocalDateTime assignedAt;
    LocalDateTime updatedAt;
    String reviewerComment;
    String reviewerCategory;
    List<ReviewQueueAnnotationResponse> annotations;
}
