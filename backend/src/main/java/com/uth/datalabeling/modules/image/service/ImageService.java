package com.uth.datalabeling.modules.image.service;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import com.uth.datalabeling.modules.iam.entity.User;
import com.uth.datalabeling.modules.iam.repository.UserRepository;
import com.uth.datalabeling.modules.image.dto.response.ImageUploadResponse;
import com.uth.datalabeling.modules.image.entity.FileMetadata;
import com.uth.datalabeling.modules.image.repository.FileMetadataRepository;
import com.uth.datalabeling.modules.image.strategy.ImageStorageStrategy;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ImageService {

    private final ImageValidator imageValidator;
    private final FileMetadataRepository fileMetadataRepository;
    private final UserRepository userRepository;
    private final List<ImageStorageStrategy> storageStrategies;

    @Transactional
    public List<ImageUploadResponse> uploadImages(List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            throw new AppException(ErrorCode.BAD_REQUEST);
        }

        User currentUser = getCurrentUser();
        ImageStorageStrategy activeStrategy = getActiveStrategy();
        List<ImageUploadResponse> responses = new ArrayList<>();

        for (MultipartFile file : files) {
            // 1. Validate image
            imageValidator.validateImage(file);

            // 2. Upload image via active strategy
            Map<String, Object> uploadResult = activeStrategy.upload(file);

            // 3. Save metadata
            FileMetadata fileMetadata = FileMetadata.builder()
                    .fileName(file.getOriginalFilename())
                    .filePath((String) uploadResult.get("filePath"))
                    .format((String) uploadResult.get("format"))
                    .sizeBytes((Long) uploadResult.get("sizeBytes"))
                    .uploader(currentUser)
                    .metadata((Map<String, Object>) uploadResult.get("metadata")) // Store raw specific details if any
                    .build();

            fileMetadata = fileMetadataRepository.save(fileMetadata);

            // 4. Map to response
            responses.add(ImageUploadResponse.builder()
                    .id(fileMetadata.getId())
                    .fileName(fileMetadata.getFileName())
                    .filePath(fileMetadata.getFilePath())
                    .format(fileMetadata.getFormat())
                    .sizeBytes(fileMetadata.getSizeBytes())
                    .width(uploadResult.get("width") instanceof Number n ? n.intValue() : null)
                    .height(uploadResult.get("height") instanceof Number n ? n.intValue() : null)
                    .build());
        }

        return responses;
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private ImageStorageStrategy getActiveStrategy() {
        return storageStrategies.stream()
                .filter(ImageStorageStrategy::isPrimary)
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.INTERNAL_SERVER_ERROR));
    }
}
