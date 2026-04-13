package com.uth.datalabeling.modules.dataset.service;

import com.uth.datalabeling.modules.dataset.dto.request.DatasetCreateRequest;
import com.uth.datalabeling.modules.dataset.entity.Dataset;
import com.uth.datalabeling.modules.dataset.repository.DatasetRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class DatasetService {

    private final DatasetRepository datasetRepository;

    public Dataset create(DatasetCreateRequest request, MultipartFile file) {

        Dataset dataset = Dataset.builder()
                .name(request.getName())
                .build();

        return datasetRepository.save(dataset);
    }
}