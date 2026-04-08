package com.uth.datalabeling.modules.systemconfig.service;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import com.uth.datalabeling.modules.systemconfig.dto.request.SystemConfigurationUpdateRequest;
import com.uth.datalabeling.modules.systemconfig.dto.response.SystemConfigurationResponse;
import com.uth.datalabeling.modules.systemconfig.entity.SystemConfiguration;
import com.uth.datalabeling.modules.systemconfig.repository.SystemConfigurationRepository;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SystemConfigurationService {
  static final int SINGLETON_ID = 1;
  static final int DEFAULT_MAX_IMAGE_FILE_SIZE_MB = 20;
  static final int DEFAULT_PAGE_SIZE = 25;
  static final String DEFAULT_IMAGE_EXTENSIONS = "jpg,jpeg,png,webp";

  SystemConfigurationRepository systemConfigurationRepository;

  public SystemConfigurationResponse getConfiguration() {
    return toResponse(getOrCreateSingleton());
  }

  public SystemConfigurationResponse updateConfiguration(SystemConfigurationUpdateRequest request,
      String updatedBy) {
    SystemConfiguration config = getOrCreateSingleton();

    config.setMaxImageFileSizeMb(request.getMaxImageFileSizeMb());
    config.setAiLabelingEnabled(Boolean.TRUE.equals(request.getAiLabelingEnabled()));
    config.setDefaultPageSize(request.getDefaultPageSize());
    config.setAllowedImageExtensions(joinExtensions(request.getAllowedImageExtensions()));
    config.setUpdatedBy(updatedBy);

    return toResponse(systemConfigurationRepository.save(config));
  }

  private SystemConfiguration getOrCreateSingleton() {
    return systemConfigurationRepository.findById(SINGLETON_ID)
        .orElseGet(() -> systemConfigurationRepository.save(defaultConfig()));
  }

  private SystemConfiguration defaultConfig() {
    return SystemConfiguration.builder()
        .id(SINGLETON_ID)
        .maxImageFileSizeMb(DEFAULT_MAX_IMAGE_FILE_SIZE_MB)
        .aiLabelingEnabled(true)
        .defaultPageSize(DEFAULT_PAGE_SIZE)
        .allowedImageExtensions(DEFAULT_IMAGE_EXTENSIONS)
        .updatedBy("system")
        .build();
  }

  private SystemConfigurationResponse toResponse(SystemConfiguration entity) {
    return SystemConfigurationResponse.builder()
        .maxImageFileSizeMb(entity.getMaxImageFileSizeMb())
        .aiLabelingEnabled(entity.isAiLabelingEnabled())
        .defaultPageSize(entity.getDefaultPageSize())
        .allowedImageExtensions(splitExtensions(entity.getAllowedImageExtensions()))
        .updatedBy(entity.getUpdatedBy())
        .updatedAt(entity.getUpdatedAt())
        .build();
  }

  private String joinExtensions(List<String> extensions) {
    return extensions.stream()
        .map(ext -> normalizeExtension(ext))
        .distinct()
        .collect(Collectors.joining(","));
  }

  private String normalizeExtension(String extension) {
    String normalized = extension == null ? "" : extension.trim().toLowerCase(Locale.ROOT);
    if (!normalized.matches("^[a-z0-9]+$")) {
      throw new AppException(ErrorCode.INVALID_IMAGE_EXTENSION);
    }
    return normalized;
  }

  private List<String> splitExtensions(String extensions) {
    return Arrays.stream(extensions.split(","))
        .map(String::trim)
        .filter(ext -> !ext.isBlank())
        .toList();
  }
}
