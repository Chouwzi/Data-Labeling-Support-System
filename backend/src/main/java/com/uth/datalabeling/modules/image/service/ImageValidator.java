package com.uth.datalabeling.modules.image.service;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import com.uth.datalabeling.modules.systemconfig.dto.response.SystemConfigurationResponse;
import com.uth.datalabeling.modules.systemconfig.service.SystemConfigurationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ImageValidator {

    private final SystemConfigurationService systemConfigurationService;

    public void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.BAD_REQUEST);
        }

        SystemConfigurationResponse config = systemConfigurationService.getConfiguration();

        // Validate File Size
        long maxSizeBytes = (long) config.getMaxImageFileSizeMb() * 1024 * 1024;
        if (file.getSize() > maxSizeBytes) {
            throw new AppException(ErrorCode.FILE_SIZE_EXCEEDS_LIMIT);
        }

        // Validate File Extension / Format
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            throw new AppException(ErrorCode.INVALID_FILE_FORMAT);
        }

        int lastIndex = originalFilename.lastIndexOf('.');
        if (lastIndex == -1) {
            throw new AppException(ErrorCode.INVALID_FILE_FORMAT);
        }

        String extension = originalFilename.substring(lastIndex + 1).toLowerCase();
        List<String> allowedExtensions = config.getAllowedImageExtensions();

        if (allowedExtensions == null || !allowedExtensions.contains(extension)) {
            throw new AppException(ErrorCode.INVALID_FILE_FORMAT);
        }

        // Validate Magic Bytes using Apache Tika
        try {
            org.apache.tika.Tika tika = new org.apache.tika.Tika();
            String detectedType = tika.detect(file.getInputStream());
            if (detectedType == null || !detectedType.startsWith("image/")) {
                throw new AppException(ErrorCode.INVALID_FILE_FORMAT);
            }
        } catch (java.io.IOException e) {
            throw new AppException(ErrorCode.INVALID_FILE_FORMAT);
        }
    }
}
