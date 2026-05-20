package com.uth.datalabeling.modules.review.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReviewQueueImageResponse {
    UUID taskId;
    UUID projectId;
    String projectName;
    UUID sampleId;
    String imageUrl;
    String status;
    UUID annotatorId;
    String annotatorName;
    UUID reviewerId;
    String reviewerName;
    LocalDateTime submittedAt;
    LocalDateTime reviewedAt;
    UUID defectCategoryId;
    String defectCategoryName;
    String comments;
    String reviewAction;
    List<ReviewQueueAnnotationResponse> annotations;
}
