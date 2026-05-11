package com.uth.datalabeling.modules.dataset.controller;

import com.uth.datalabeling.common.response.ApiResponse;
import com.uth.datalabeling.modules.dataset.dto.request.DatasetRequest;
import com.uth.datalabeling.modules.dataset.dto.response.DataSampleResponse;
import com.uth.datalabeling.modules.dataset.dto.response.DatasetResponse;
import com.uth.datalabeling.modules.dataset.service.DatasetService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/datasets")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DatasetController {

    DatasetService datasetService;

    @PostMapping
    public ApiResponse<DatasetResponse> createDataset(@RequestBody @Valid DatasetRequest request) {
        return ApiResponse.<DatasetResponse>builder()
                .result(datasetService.createDataset(request))
                .build();
    }

    @GetMapping
    public ApiResponse<List<DatasetResponse>> getAllDatasets() {
        return ApiResponse.<List<DatasetResponse>>builder()
                .result(datasetService.getAllDatasets())
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<DatasetResponse> getDataset(@PathVariable UUID id) {
        return ApiResponse.<DatasetResponse>builder()
                .result(datasetService.getDatasetById(id))
                .build();
    }

    @GetMapping("/{id}/samples")
    public ApiResponse<List<DataSampleResponse>> getSamples(@PathVariable UUID id) {
        return ApiResponse.<List<DataSampleResponse>>builder()
                .result(datasetService.getSamplesByDataset(id))
                .build();
    }
}
