package com.uth.datalabeling.modules.task.mapper;

import com.uth.datalabeling.modules.task.dto.response.TaskResponse;
import com.uth.datalabeling.modules.task.entity.Task;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface TaskMapper {

    @Mapping(target = "projectId", source = "project.id")
    @Mapping(target = "annotatorId", source = "annotator.id")
    @Mapping(target = "annotatorName", source = "annotator.fullName")
    @Mapping(target = "sampleId", source = "sample.id")
    @Mapping(target = "imageUrl", source = "sample.imageUrl")
    TaskResponse toTaskResponse(Task task);
}
