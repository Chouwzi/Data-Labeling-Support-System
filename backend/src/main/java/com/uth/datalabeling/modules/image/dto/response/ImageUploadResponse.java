package com.uth.datalabeling.modules.image.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImageUploadResponse {
    private UUID id;
    private String fileName;
    private String filePath;
    private String format;
    private Long sizeBytes;
    private Integer width;
    private Integer height;
}
