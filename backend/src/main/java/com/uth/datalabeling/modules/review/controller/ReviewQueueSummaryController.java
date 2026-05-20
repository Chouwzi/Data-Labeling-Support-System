package com.uth.datalabeling.modules.review.controller;

import com.uth.datalabeling.common.response.ApiResponse;
import com.uth.datalabeling.common.response.PageResponse;
import com.uth.datalabeling.modules.review.dto.response.ReviewQueueImageResponse;
import com.uth.datalabeling.modules.review.dto.response.ReviewStatsResponse;
import com.uth.datalabeling.modules.review.service.ReviewQueueService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/review-queue")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ReviewQueueSummaryController {

    ReviewQueueService reviewQueueService;

    @GetMapping("/completed")
    @PreAuthorize("hasAnyRole('REVIEWER', 'ADMIN', 'MANAGER')")
    public ApiResponse<PageResponse<ReviewQueueImageResponse>> getCompletedReviewImages(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID annotatorId,
            Pageable pageable) {
        return ApiResponse.<PageResponse<ReviewQueueImageResponse>>builder()
                .result(reviewQueueService.getCompletedReviewImages(projectId, status, annotatorId, pageable))
                .build();
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('REVIEWER', 'ADMIN', 'MANAGER')")
    public ApiResponse<ReviewStatsResponse> getReviewStats(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false, defaultValue = "today") String range) {
        return ApiResponse.<ReviewStatsResponse>builder()
                .result(reviewQueueService.getReviewStats(projectId, range))
                .build();
    }
}
