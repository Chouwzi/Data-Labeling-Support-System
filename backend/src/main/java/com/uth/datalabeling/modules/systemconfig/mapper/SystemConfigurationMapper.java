package com.uth.datalabeling.modules.systemconfig.mapper;

import com.uth.datalabeling.modules.systemconfig.dto.request.SystemConfigurationUpdateRequest;
import com.uth.datalabeling.modules.systemconfig.dto.response.SystemConfigurationResponse;
import com.uth.datalabeling.modules.systemconfig.entity.SystemConfiguration;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface SystemConfigurationMapper {

  @Mapping(target = "id", ignore = true)
  @Mapping(target = "createdAt", ignore = true)
  @Mapping(target = "updatedAt", ignore = true)
  @Mapping(target = "updatedBy", ignore = true)
  @Mapping(target = "version", ignore = true)
  @Mapping(target = "allowedImageExtensions", source = "allowedImageExtensions", qualifiedByName = "joinExtensions")
  void updateEntity(@MappingTarget SystemConfiguration entity, SystemConfigurationUpdateRequest request);

  @Mapping(target = "allowedImageExtensions", source = "allowedImageExtensions", qualifiedByName = "splitExtensions")
  SystemConfigurationResponse toResponse(SystemConfiguration entity);

  @Named("joinExtensions")
  default String joinExtensions(List<String> extensions) {
    if (extensions == null) {
      return null;
    }
    return extensions.stream()
        .map(ext -> ext == null ? "" : ext.trim().toLowerCase(Locale.ROOT))
        .filter(ext -> !ext.isEmpty())
        .distinct()
        .collect(Collectors.joining(","));
  }

  @Named("splitExtensions")
  default List<String> splitExtensions(String extensions) {
    if (extensions == null || extensions.isEmpty()) {
      return List.of();
    }
    return Arrays.stream(extensions.split(","))
        .map(String::trim)
        .filter(ext -> !ext.isEmpty())
        .toList();
  }
}
