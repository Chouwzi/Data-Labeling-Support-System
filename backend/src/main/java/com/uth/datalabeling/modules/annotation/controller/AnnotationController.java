package com.uth.datalabeling.modules.annotation.controller;

import com.uth.datalabeling.common.response.ApiResponse;
import com.uth.datalabeling.modules.annotation.dto.request.SaveAnnotationsRequest;
import com.uth.datalabeling.modules.annotation.dto.response.AnnotationResponse;
import com.uth.datalabeling.modules.annotation.service.AnnotationService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/tasks/{taskId}/annotations")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AnnotationController {

    AnnotationService annotationService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ANNOTATOR', 'MANAGER', 'REVIEWER', 'ADMIN')")
    public ApiResponse<List<AnnotationResponse>> getAnnotations(@PathVariable UUID taskId) {
        return ApiResponse.<List<AnnotationResponse>>builder()
                .result(annotationService.getAnnotations(taskId))
                .build();
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('ANNOTATOR', 'ADMIN')")
    public ApiResponse<List<AnnotationResponse>> saveAnnotations(
            @PathVariable UUID taskId,
            @RequestBody @Valid SaveAnnotationsRequest request) {
        return ApiResponse.<List<AnnotationResponse>>builder()
                .message("Annotations saved successfully.")
                .result(annotationService.saveAnnotations(taskId, request))
                .build();
    }
}
