package com.uth.datalabeling.modules.dataset.service;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import com.uth.datalabeling.modules.dataset.dto.request.DatasetRequest;
import com.uth.datalabeling.modules.dataset.dto.response.DataSampleResponse;
import com.uth.datalabeling.modules.dataset.dto.response.DatasetResponse;
import com.uth.datalabeling.modules.dataset.entity.DataSample;
import com.uth.datalabeling.modules.dataset.entity.Dataset;
import com.uth.datalabeling.modules.dataset.mapper.DatasetMapper;
import com.uth.datalabeling.modules.dataset.repository.DataSampleRepository;
import com.uth.datalabeling.modules.dataset.repository.DatasetRepository;
import com.uth.datalabeling.modules.project.service.ProjectAccessService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DatasetService {

    DatasetRepository datasetRepository;
    DataSampleRepository dataSampleRepository;
    DatasetMapper datasetMapper;
    ProjectAccessService projectAccessService;

    @Transactional
    public DatasetResponse createDataset(DatasetRequest request) {
        Dataset dataset = datasetMapper.toDataset(request);
        dataset.setCreator(projectAccessService.getCurrentUser());
        return datasetMapper.toDatasetResponse(datasetRepository.save(dataset));
    }

    @Transactional(readOnly = true)
    public List<DatasetResponse> getAllDatasets() {
        return datasetRepository.findAll().stream()
                .map(datasetMapper::toDatasetResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DatasetResponse getDatasetById(UUID id) {
        Dataset dataset = datasetRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.DATASET_NOT_FOUND));
        return datasetMapper.toDatasetResponse(dataset);
    }

    @Transactional
    public DataSampleResponse addSampleToDataset(UUID datasetId, String imageUrl, java.util.Map<String, Object> metadata) {
        Dataset dataset = datasetRepository.findById(datasetId)
                .orElseThrow(() -> new AppException(ErrorCode.DATASET_NOT_FOUND));

        DataSample sample = DataSample.builder()
                .dataset(dataset)
                .imageUrl(imageUrl)
                .metadata(metadata)
                .build();

        return datasetMapper.toDataSampleResponse(dataSampleRepository.save(sample));
    }
    
    @Transactional(readOnly = true)
    public List<DataSampleResponse> getSamplesByDataset(UUID datasetId) {
        Dataset dataset = datasetRepository.findById(datasetId)
                .orElseThrow(() -> new AppException(ErrorCode.DATASET_NOT_FOUND));
        return dataset.getDataSamples().stream()
                .map(datasetMapper::toDataSampleResponse)
                .collect(Collectors.toList());
    }
}
