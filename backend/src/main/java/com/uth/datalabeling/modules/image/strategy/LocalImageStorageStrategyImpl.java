package com.uth.datalabeling.modules.image.strategy;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class LocalImageStorageStrategyImpl implements ImageStorageStrategy {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Value("${storage.strategy.active:local}")
    private String activeStrategy;

    @Override
    public Map<String, Object> upload(MultipartFile file) {
        try {
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String originalFilename = StringUtils
                    .cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "unknown");

            // Check for path traversal attacks
            if (originalFilename.contains("..")) {
                throw new AppException(ErrorCode.INVALID_FILE_FORMAT);
            }

            // Generate unique filename
            String fileExtension = "";
            int lastIndex = originalFilename.lastIndexOf('.');
            if (lastIndex > 0) {
                fileExtension = originalFilename.substring(lastIndex);
            }
            String uniqueFilename = UUID.randomUUID().toString() + fileExtension;
            Path targetLocation = uploadPath.resolve(uniqueFilename);

            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            Map<String, Object> result = new HashMap<>();
            result.put("filePath", targetLocation.toString());
            result.put("format", file.getContentType());
            result.put("sizeBytes", file.getSize());

            return result;
        } catch (IOException ex) {
            throw new AppException(ErrorCode.UPLOAD_FAILED);
        }
    }

    @Override
    public boolean isPrimary() {
        return "local".equalsIgnoreCase(activeStrategy);
    }
}
