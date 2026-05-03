package com.uth.datalabeling.modules.image.strategy;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class CloudinaryImageStorageStrategyImpl implements ImageStorageStrategy {

    private final Cloudinary cloudinary;

    @Value("${storage.strategy.active:local}")
    private String activeStrategy;

    @Override
    public Map<String, Object> upload(MultipartFile file) {
        try {
            log.info("Uploading file to Cloudinary: {}", file.getOriginalFilename());

            // Upload the file
            // Cloudinary returns a map containing the URL, public_id, format, bytes, etc.
            Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.emptyMap());

            String secureUrl = (String) uploadResult.get("secure_url");
            String format = (String) uploadResult.get("format");
            Object bytesRaw = uploadResult.get("bytes");
            long sizeBytes = bytesRaw instanceof Number
                    ? ((Number) bytesRaw).longValue()
                    : file.getSize();

            // Construct the standardized result
            Map<String, Object> result = new HashMap<>();
            result.put("filePath", secureUrl);
            // Since it's cloudinary, the format returned could be just "png".
            // The file.getContentType() provides standard mime type like "image/png"
            result.put("format", file.getContentType());
            result.put("sizeBytes", sizeBytes);

            // Add raw uploadResult for JSONB storage
            Map<String, Object> rawMetadata = new HashMap<>();
            for (Map.Entry<?, ?> entry : uploadResult.entrySet()) {
                if (entry.getKey() instanceof String) {
                    rawMetadata.put((String) entry.getKey(), entry.getValue());
                }
            }
            result.put("metadata", rawMetadata);

            log.info("Successfully uploaded file to Cloudinary: {}", secureUrl);
            return result;
        } catch (IOException e) {
            log.error("Failed to upload file to Cloudinary", e);
            throw new AppException(ErrorCode.UPLOAD_FAILED);
        }
    }

    @Override
    public boolean isPrimary() {
        return "cloudinary".equalsIgnoreCase(activeStrategy);
    }
}
