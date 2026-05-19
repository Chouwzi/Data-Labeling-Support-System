package com.uth.datalabeling.modules.dataset.mapper;

import com.uth.datalabeling.modules.dataset.dto.request.DatasetRequest;
import com.uth.datalabeling.modules.dataset.dto.response.DataSampleResponse;
import com.uth.datalabeling.modules.dataset.dto.response.DatasetResponse;
import com.uth.datalabeling.modules.dataset.entity.DataSample;
import com.uth.datalabeling.modules.dataset.entity.Dataset;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface DatasetMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "creator", ignore = true)
    @Mapping(target = "dataSamples", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    Dataset toDataset(DatasetRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "creator", ignore = true)
    @Mapping(target = "dataSamples", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    void updateDataset(@MappingTarget Dataset dataset, DatasetRequest request);

    @Mapping(target = "creatorId", source = "creator.id")
    DatasetResponse toDatasetResponse(Dataset dataset);

    @Mapping(target = "datasetId", source = "dataset.id")
    DataSampleResponse toDataSampleResponse(DataSample dataSample);
}
