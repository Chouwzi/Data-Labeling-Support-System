package com.uth.datalabeling.modules.dataset.controller;

import com.uth.datalabeling.common.response.ApiResponse;
import com.uth.datalabeling.common.response.PageResponse;
import com.uth.datalabeling.modules.dataset.dto.request.DatasetRequest;
import com.uth.datalabeling.modules.dataset.dto.response.DataSampleResponse;
import com.uth.datalabeling.modules.dataset.dto.response.DatasetResponse;
import com.uth.datalabeling.modules.dataset.service.DatasetService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/datasets")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DatasetController {

    DatasetService datasetService;

    /**
     * Tạo mới một tập dữ liệu (Dataset).
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ApiResponse<DatasetResponse> createDataset(@RequestBody @Valid DatasetRequest request) {
        return ApiResponse.<DatasetResponse>builder()
                .result(datasetService.createDataset(request))
                .build();
    }

    /**
     * Lấy danh sách tất cả tập dữ liệu.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ApiResponse<PageResponse<DatasetResponse>> getAllDatasets(
            @ParameterObject @PageableDefault(size = 24) Pageable pageable) {
        return ApiResponse.<PageResponse<DatasetResponse>>builder()
                .result(datasetService.getAllDatasets(pageable))
                .build();
    }

    /**
     * Lấy chi tiết một tập dữ liệu theo ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ApiResponse<DatasetResponse> getDataset(@PathVariable UUID id) {
        return ApiResponse.<DatasetResponse>builder()
                .result(datasetService.getDatasetById(id))
                .build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ApiResponse<DatasetResponse> updateDataset(
            @PathVariable UUID id,
            @RequestBody @Valid DatasetRequest request) {
        return ApiResponse.<DatasetResponse>builder()
                .result(datasetService.updateDataset(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ApiResponse<Void> deleteDataset(@PathVariable UUID id) {
        datasetService.deleteDataset(id);
        return ApiResponse.<Void>builder()
                .message("Dataset deleted successfully")
                .build();
    }

    /**
     * Lấy danh sách các mẫu dữ liệu (DataSamples) trong tập dữ liệu.
     */
    @GetMapping("/{id}/samples")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ApiResponse<PageResponse<DataSampleResponse>> getSamples(
            @PathVariable UUID id,
            @ParameterObject @PageableDefault(size = 24) Pageable pageable) {
        return ApiResponse.<PageResponse<DataSampleResponse>>builder()
                .result(datasetService.getSamplesByDataset(id, pageable))
                .build();
    }

    /**
     * Tải lên các mẫu dữ liệu (hình ảnh) vào tập dữ liệu.
     */
    @PostMapping("/{id}/samples")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ApiResponse<List<DataSampleResponse>> uploadSamples(
            @PathVariable UUID id,
            @RequestParam("file") List<org.springframework.web.multipart.MultipartFile> files) {
        return ApiResponse.<List<DataSampleResponse>>builder()
                .result(datasetService.uploadSamples(id, files))
                .build();
    }

    /**
     * Xóa một mẫu dữ liệu (hình ảnh) trong tập dữ liệu.
     */
    @DeleteMapping("/{id}/samples/{sampleId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ApiResponse<Void> deleteSample(@PathVariable UUID id, @PathVariable UUID sampleId) {
        datasetService.deleteSample(id, sampleId);
        return ApiResponse.<Void>builder()
                .message("Sample deleted successfully")
                .build();
    }
}
