package com.uth.datalabeling.modules.file.controller;

import java.util.UUID;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.uth.datalabeling.modules.file.dto.FileResponse;
import com.uth.datalabeling.modules.file.entity.ProjectFile;
import com.uth.datalabeling.modules.file.service.FileService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class FileController {

    FileService fileService;

    // UPLOAD FILE
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<FileResponse> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("projectId") UUID projectId
    ) {

        // validate input
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File is required");
        }

        if (projectId == null) {
            throw new RuntimeException("ProjectId is required");
        }

        ProjectFile savedFile = fileService.upload(file, projectId);

        // map sang DTO
        FileResponse response = FileResponse.builder()
                .id(savedFile.getId())
                .fileName(savedFile.getFileName())
                .fileType(savedFile.getFileType())
                .fileSize(savedFile.getFileSize())
                .build();

        return ResponseEntity.ok(response);
    }

    // GET FILE BY ID
    @GetMapping("/{id}")
    public ResponseEntity<ProjectFile> getFile(@PathVariable UUID id) {

        ProjectFile file = fileService.getById(id);

        return ResponseEntity.ok(file);
    }

}