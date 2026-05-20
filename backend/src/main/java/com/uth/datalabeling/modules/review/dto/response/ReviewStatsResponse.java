package com.uth.datalabeling.modules.review.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReviewStatsResponse {
    long pendingReview;
    long approved;
    long rejected;
    long totalReviewed;
    Double approvalRate;
    Double rejectionRate;
    Double averageReviewTimeSeconds;
}
