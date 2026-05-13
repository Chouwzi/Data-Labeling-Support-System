package com.uth.datalabeling.modules.annotation.controller;

import com.uth.datalabeling.common.response.ApiResponse;
import com.uth.datalabeling.modules.annotation.dto.request.AnnotationSubmitRequest;
import com.uth.datalabeling.modules.annotation.dto.response.AnnotationResponse;
import com.uth.datalabeling.modules.annotation.service.AnnotationService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/tasks/{taskId}/annotations")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AnnotationController {

    AnnotationService annotationService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ANNOTATOR')")
    public ApiResponse<AnnotationResponse> submitAnnotation(
            @PathVariable UUID taskId,
            @RequestBody @Valid AnnotationSubmitRequest request) {
        return ApiResponse.<AnnotationResponse>builder()
                .code(HttpStatus.CREATED.value())
                .message("Annotation submitted successfully.")
                .result(annotationService.submitAnnotation(taskId, request))
                .build();
    }
}
