package com.uth.datalabeling.modules.dataset.service;

import com.uth.datalabeling.modules.dataset.dto.request.DatasetCreateRequest;
import com.uth.datalabeling.modules.dataset.entity.Dataset;
import com.uth.datalabeling.modules.dataset.repository.DatasetRepository;
import com.uth.datalabeling.modules.file.entity.ProjectFile;
import com.uth.datalabeling.modules.file.service.FileService;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
@Service
@RequiredArgsConstructor
public class DatasetService {

    private final DatasetRepository datasetRepository;
    private final FileService fileService;

    public Dataset create(DatasetCreateRequest request, MultipartFile file) {

        if (datasetRepository.existsByName(request.getName())) {
            throw new RuntimeException("Dataset name already exists");
        }

        String filePath = null;

        if (file != null && !file.isEmpty()) {
            ProjectFile uploadedFile = fileService.upload(file, request.getProjectId());
            filePath = uploadedFile.getFilePath();
        }

        Dataset dataset = Dataset.builder()
                .name(request.getName())
                .filePath(filePath)
                .build();

        return datasetRepository.save(dataset);
    }
}