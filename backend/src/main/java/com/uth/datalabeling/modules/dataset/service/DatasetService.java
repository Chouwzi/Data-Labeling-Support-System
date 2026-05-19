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
import com.uth.datalabeling.modules.task.entity.Task;
import com.uth.datalabeling.modules.task.repository.TaskRepository;
import com.uth.datalabeling.modules.annotation.repository.AnnotationRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
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
    com.uth.datalabeling.modules.image.service.ImageService imageService;
    TaskRepository taskRepository;
    AnnotationRepository annotationRepository;

    /**
     * Tạo mới một tập dữ liệu.
     */
    @Transactional
    public DatasetResponse createDataset(DatasetRequest request) {
        Dataset dataset = datasetMapper.toDataset(request);
        dataset.setCreator(projectAccessService.getCurrentUser());
        return datasetMapper.toDatasetResponse(datasetRepository.save(dataset));
    }

    /**
     * Lấy danh sách tất cả tập dữ liệu.
     */
    @Transactional(readOnly = true)
    public List<DatasetResponse> getAllDatasets() {
        return datasetRepository.findAllByDeletedAtIsNull().stream()
                .map(datasetMapper::toDatasetResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lấy chi tiết tập dữ liệu theo ID.
     */
    @Transactional(readOnly = true)
    public DatasetResponse getDatasetById(UUID id) {
        Dataset dataset = datasetRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new AppException(ErrorCode.DATASET_NOT_FOUND));
        return datasetMapper.toDatasetResponse(dataset);
    }

    @Transactional
    public DatasetResponse updateDataset(UUID id, DatasetRequest request) {
        Dataset dataset = datasetRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new AppException(ErrorCode.DATASET_NOT_FOUND));
        datasetMapper.updateDataset(dataset, request);
        return datasetMapper.toDatasetResponse(datasetRepository.save(dataset));
    }

    @Transactional
    public void deleteDataset(UUID id) {
        Dataset dataset = datasetRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new AppException(ErrorCode.DATASET_NOT_FOUND));
        dataset.setDeletedAt(LocalDateTime.now());
        datasetRepository.save(dataset);
    }

    /**
     * Thêm một mẫu dữ liệu (hình ảnh) vào tập dữ liệu.
     */
    @Transactional
    public DataSampleResponse addSampleToDataset(UUID datasetId, String imageUrl,
            java.util.Map<String, Object> metadata) {
        Dataset dataset = datasetRepository.findByIdAndDeletedAtIsNull(datasetId)
                .orElseThrow(() -> new AppException(ErrorCode.DATASET_NOT_FOUND));

        DataSample sample = DataSample.builder()
                .dataset(dataset)
                .imageUrl(imageUrl)
                .metadata(metadata)
                .build();

        return datasetMapper.toDataSampleResponse(dataSampleRepository.save(sample));
    }

    /**
     * Lấy danh sách mẫu dữ liệu thuộc về một tập dữ liệu.
     */
    @Transactional(readOnly = true)
    public List<DataSampleResponse> getSamplesByDataset(UUID datasetId) {
        Dataset dataset = datasetRepository.findByIdAndDeletedAtIsNull(datasetId)
                .orElseThrow(() -> new AppException(ErrorCode.DATASET_NOT_FOUND));
        return dataset.getDataSamples().stream()
                .map(datasetMapper::toDataSampleResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<DataSampleResponse> uploadSamples(UUID datasetId,
            List<org.springframework.web.multipart.MultipartFile> files) {
        Dataset dataset = datasetRepository.findByIdAndDeletedAtIsNull(datasetId)
                .orElseThrow(() -> new AppException(ErrorCode.DATASET_NOT_FOUND));

        var uploadResponses = imageService.uploadImages(files);
        List<DataSampleResponse> sampleResponses = new java.util.ArrayList<>();

        for (var uploadRes : uploadResponses) {
            // Build metadata map - include dimensions for future COCO export
            java.util.Map<String, Object> metadata = new java.util.HashMap<>();
            metadata.put("fileName", uploadRes.getFileName());
            metadata.put("sizeBytes", uploadRes.getSizeBytes());
            metadata.put("format", uploadRes.getFormat());
            if (uploadRes.getWidth() != null)
                metadata.put("width", uploadRes.getWidth());
            if (uploadRes.getHeight() != null)
                metadata.put("height", uploadRes.getHeight());

            DataSample sample = DataSample.builder()
                    .dataset(dataset)
                    .imageUrl(uploadRes.getFilePath())
                    .metadata(metadata)
                    .build();
            sampleResponses.add(datasetMapper.toDataSampleResponse(dataSampleRepository.save(sample)));
        }

        return sampleResponses;
    }

    @Transactional
    public void deleteSample(UUID datasetId, UUID sampleId) {
        Dataset dataset = datasetRepository.findById(datasetId)
                .orElseThrow(() -> new AppException(ErrorCode.DATASET_NOT_FOUND));

        DataSample sample = dataSampleRepository.findById(sampleId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));

        // Ensure the sample actually belongs to this dataset
        if (!sample.getDataset().getId().equals(dataset.getId())) {
            throw new AppException(ErrorCode.NOT_FOUND);
        }

        // Delete associated tasks and annotations first to prevent foreign key
        // constraint violations
        List<Task> relatedTasks = taskRepository.findBySampleId(sample.getId());
        for (Task task : relatedTasks) {
            annotationRepository.deleteByTaskId(task.getId());
        }
        taskRepository.deleteAll(relatedTasks);

        // We could also delete the physical file from LocalStorageService if needed:
        // localStorageService.deleteFile(sample.getImageUrl());
        // For now, just deleting the DB record.

        dataSampleRepository.delete(sample);
    }
}
