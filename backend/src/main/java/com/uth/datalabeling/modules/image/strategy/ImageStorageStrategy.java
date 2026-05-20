package com.uth.datalabeling.modules.image.strategy;

import org.springframework.web.multipart.MultipartFile;
import java.util.Map;

public interface ImageStorageStrategy {
    /**
     * Uploads the file to the underlying storage mechanism.
     * @param file The file to upload.
     * @return A map containing information about the upload (e.g., filePath, format, sizeBytes).
     */
    Map<String, Object> upload(MultipartFile file);
    
    /**
     * Determines if this strategy is the active one.
     */
    boolean isPrimary();
}
