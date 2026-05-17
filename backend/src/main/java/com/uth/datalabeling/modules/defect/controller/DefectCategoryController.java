package com.uth.datalabeling.modules.defect.controller;

import com.uth.datalabeling.common.response.ApiResponse;
import com.uth.datalabeling.modules.defect.dto.request.DefectCategoryRequest;
import com.uth.datalabeling.modules.defect.dto.response.DefectCategoryResponse;
import com.uth.datalabeling.modules.defect.service.DefectCategoryService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/defect-categories")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DefectCategoryController {

    DefectCategoryService defectCategoryService;

    @GetMapping
    @PreAuthorize("hasAnyRole('REVIEWER', 'ADMIN', 'MANAGER')")
    public ApiResponse<List<DefectCategoryResponse>> getAllDefectCategories() {
        return ApiResponse.<List<DefectCategoryResponse>>builder()
                .result(defectCategoryService.getAllDefectCategories())
                .build();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('REVIEWER', 'ADMIN', 'MANAGER')")
    public ApiResponse<DefectCategoryResponse> getDefectCategoryById(@PathVariable UUID id) {
        return ApiResponse.<DefectCategoryResponse>builder()
                .result(defectCategoryService.getDefectCategoryById(id))
                .build();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<DefectCategoryResponse> createDefectCategory(@Valid @RequestBody DefectCategoryRequest request) {
        return ApiResponse.<DefectCategoryResponse>builder()
                .result(defectCategoryService.createDefectCategory(request))
                .build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<DefectCategoryResponse> updateDefectCategory(
            @PathVariable UUID id,
            @Valid @RequestBody DefectCategoryRequest request) {
        return ApiResponse.<DefectCategoryResponse>builder()
                .result(defectCategoryService.updateDefectCategory(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> deleteDefectCategory(@PathVariable UUID id) {
        defectCategoryService.deleteDefectCategory(id);
        return ApiResponse.<Void>builder()
                .message("Defect category deleted successfully")
                .build();
    }
}
