package com.uth.datalabeling.modules.systemconfig.service;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import com.uth.datalabeling.modules.systemconfig.dto.request.SystemConfigurationUpdateRequest;
import com.uth.datalabeling.modules.systemconfig.dto.response.SystemConfigurationResponse;
import com.uth.datalabeling.modules.systemconfig.entity.SystemConfiguration;
import com.uth.datalabeling.modules.systemconfig.mapper.SystemConfigurationMapper;
import com.uth.datalabeling.modules.systemconfig.repository.SystemConfigurationRepository;
import java.util.Locale;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SystemConfigurationService {
  static final int SINGLETON_ID = 1;
  static final int DEFAULT_MAX_IMAGE_FILE_SIZE_MB = 20;
  static final int DEFAULT_PAGE_SIZE = 25;
  static final String DEFAULT_IMAGE_EXTENSIONS = "jpg,jpeg,png,webp";

  SystemConfigurationRepository systemConfigurationRepository;
  SystemConfigurationMapper systemConfigurationMapper;

  @Transactional
  public SystemConfigurationResponse getConfiguration() {
    return systemConfigurationMapper.toResponse(getOrCreateSingleton());
  }

  @Transactional
  public SystemConfigurationResponse updateConfiguration(SystemConfigurationUpdateRequest request,
      String updatedBy) {
    validateExtensions(request.getAllowedImageExtensions());

    SystemConfiguration config = getOrCreateSingleton();
    systemConfigurationMapper.updateEntity(config, request);
    config.setUpdatedBy(updatedBy);

    return systemConfigurationMapper.toResponse(systemConfigurationRepository.save(config));
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
        .version(0L)
        .build();
  }

  private void validateExtensions(java.util.List<String> extensions) {
    if (extensions != null) {
      for (String ext : extensions) {
        String normalized = ext == null ? "" : ext.trim().toLowerCase(Locale.ROOT);
        if (!normalized.matches("^[a-z0-9]+$")) {
          throw new AppException(ErrorCode.INVALID_IMAGE_EXTENSION);
        }
      }
    }
  }
}
