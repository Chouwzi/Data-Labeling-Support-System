package com.uth.datalabeling.modules.dataset.service;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.modules.dataset.dto.request.DatasetRequest;
import com.uth.datalabeling.modules.dataset.dto.response.DataSampleResponse;
import com.uth.datalabeling.modules.dataset.dto.response.DatasetResponse;
import com.uth.datalabeling.modules.dataset.entity.DataSample;
import com.uth.datalabeling.modules.dataset.entity.Dataset;
import com.uth.datalabeling.modules.dataset.mapper.DatasetMapper;
import com.uth.datalabeling.modules.dataset.repository.DataSampleRepository;
import com.uth.datalabeling.modules.dataset.repository.DatasetRepository;
import com.uth.datalabeling.modules.project.service.ProjectAccessService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DatasetServiceTest {

    @Mock
    private DatasetRepository datasetRepository;

    @Mock
    private DataSampleRepository dataSampleRepository;

    @Mock
    private DatasetMapper datasetMapper;

    @Mock
    private ProjectAccessService projectAccessService;

    @InjectMocks
    private DatasetService datasetService;

    private UUID datasetId;
    private Dataset dataset;
    private DatasetResponse datasetResponse;

    @BeforeEach
    void setUp() {
        datasetId = UUID.randomUUID();
        dataset = Dataset.builder()
                .id(datasetId)
                .name("Test Dataset")
                .description("Test Description")
                .build();

        datasetResponse = DatasetResponse.builder()
                .id(datasetId)
                .name("Test Dataset")
                .description("Test Description")
                .build();
    }

    @Test
    void createDataset_Success() {
        DatasetRequest request = new DatasetRequest();
        request.setName("Test Dataset");

        when(datasetMapper.toDataset(request)).thenReturn(dataset);
        when(projectAccessService.getCurrentUser()).thenReturn(null); // Mock current user if needed
        when(datasetRepository.save(any())).thenReturn(dataset);
        when(datasetMapper.toDatasetResponse(dataset)).thenReturn(datasetResponse);

        DatasetResponse result = datasetService.createDataset(request);

        assertNotNull(result);
        assertEquals("Test Dataset", result.getName());
        verify(datasetRepository).save(any());
    }

    @Test
    void getDatasetById_Success() {
        when(datasetRepository.findById(datasetId)).thenReturn(Optional.of(dataset));
        when(datasetMapper.toDatasetResponse(dataset)).thenReturn(datasetResponse);

        DatasetResponse result = datasetService.getDatasetById(datasetId);

        assertNotNull(result);
        assertEquals(datasetId, result.getId());
    }

    @Test
    void getDatasetById_NotFound() {
        when(datasetRepository.findById(datasetId)).thenReturn(Optional.empty());

        assertThrows(AppException.class, () -> datasetService.getDatasetById(datasetId));
    }

    @Test
    void addSampleToDataset_Success() {
        String imageUrl = "http://example.com/image.jpg";
        DataSample sample = DataSample.builder().imageUrl(imageUrl).dataset(dataset).build();
        DataSampleResponse sampleResponse = DataSampleResponse.builder().imageUrl(imageUrl).build();

        when(datasetRepository.findById(datasetId)).thenReturn(Optional.of(dataset));
        when(dataSampleRepository.save(any())).thenReturn(sample);
        when(datasetMapper.toDataSampleResponse(sample)).thenReturn(sampleResponse);

        DataSampleResponse result = datasetService.addSampleToDataset(datasetId, imageUrl, null);

        assertNotNull(result);
        assertEquals(imageUrl, result.getImageUrl());
        verify(dataSampleRepository).save(any());
    }
}
