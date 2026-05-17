package com.uth.datalabeling.modules.review.controller;

import com.uth.datalabeling.common.response.ApiResponse;
import com.uth.datalabeling.common.response.PageResponse;
import com.uth.datalabeling.modules.review.dto.response.ReviewQueueImageResponse;
import com.uth.datalabeling.modules.review.service.ReviewQueueService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;
import com.uth.datalabeling.modules.review.dto.request.RejectImageRequest;

import java.util.UUID;

@RestController
@RequestMapping("/review-queue/images")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ReviewQueueController {

    ReviewQueueService reviewQueueService;

    @GetMapping
    @PreAuthorize("hasAnyRole('REVIEWER', 'ADMIN', 'MANAGER')")
    public ApiResponse<PageResponse<ReviewQueueImageResponse>> getReviewQueueImages(
            @RequestParam(required = false) UUID projectId,
            Pageable pageable) {
        return ApiResponse.<PageResponse<ReviewQueueImageResponse>>builder()
                .result(reviewQueueService.getPendingReviewImages(projectId, pageable))
                .build();
    }

    @PostMapping("/{taskId}/reject")
    @PreAuthorize("hasAnyRole('REVIEWER', 'ADMIN', 'MANAGER')")
    public ApiResponse<Void> rejectImage(
            @PathVariable UUID taskId,
            @Valid @RequestBody RejectImageRequest request) {
        reviewQueueService.rejectImage(taskId, request);
        return ApiResponse.<Void>builder()
                .message("Image rejected successfully")
                .build();
    }
}
