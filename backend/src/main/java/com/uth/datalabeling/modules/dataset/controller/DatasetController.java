package com.uth.datalabeling.modules.dataset.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.uth.datalabeling.modules.dataset.dto.request.DatasetCreateRequest;
import com.uth.datalabeling.modules.dataset.dto.response.DatasetResponse;
import com.uth.datalabeling.modules.dataset.entity.Dataset;
import com.uth.datalabeling.modules.dataset.service.DatasetService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/datasets")
@RequiredArgsConstructor
public class DatasetController {

    private final DatasetService service;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public DatasetResponse create(
            @RequestPart("data") String data,
            @RequestPart(value = "guidelineFile", required = false) MultipartFile guidelineFile
    ) throws Exception {

        DatasetCreateRequest request =
                objectMapper.readValue(data, DatasetCreateRequest.class);

        Dataset dataset = service.create(request, guidelineFile);

        return DatasetResponse.builder()
                .id(dataset.getId())
                .name(dataset.getName())
                .createdAt(dataset.getCreatedAt())
                .build();
    }
}