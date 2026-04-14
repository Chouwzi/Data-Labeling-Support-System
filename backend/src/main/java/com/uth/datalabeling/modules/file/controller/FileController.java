package com.uth.datalabeling.modules.file.controller;

import com.uth.datalabeling.modules.file.entity.ProjectFile;
import com.uth.datalabeling.modules.file.service.FileService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.uth.datalabeling.modules.file.dto.FileResponse;
import java.util.UUID;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class FileController {

    FileService fileService;
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public ResponseEntity<FileResponse> upload(
        @RequestParam("file") MultipartFile file,
        @RequestParam("projectId") UUID projectId
) {

    if (file == null || file.isEmpty()) {
        throw new RuntimeException("File is required");
    }

    if (projectId == null) {
        throw new RuntimeException("ProjectId is required");
    }

    ProjectFile savedFile = fileService.upload(file, projectId);

    //  map sang DTO
    FileResponse response = FileResponse.builder()
            .id(savedFile.getId())
            .fileName(savedFile.getFileName())
            .fileType(savedFile.getFileType())
            .fileSize(savedFile.getFileSize())
            .build();

    return ResponseEntity.ok(response);
}
}