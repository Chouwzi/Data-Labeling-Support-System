package com.uth.datalabeling.modules.project.dto.response;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import java.util.UUID;
@Getter
@Setter
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class FileResponse {
    UUID id;
    String fileName;
    String fileType;
    Long fileSize;
}
