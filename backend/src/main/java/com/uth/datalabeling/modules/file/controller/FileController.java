package com.uth.datalabeling.modules.file.controller;

import com.uth.datalabeling.modules.file.entity.ProjectFile;
import com.uth.datalabeling.modules.file.service.FileService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class FileController {

    FileService fileService;
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ProjectFile> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("projectId") UUID projectId
    ) {

        // validate input (tránh lỗi null)
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File is required");
        }

        if (projectId == null) {
            throw new RuntimeException("ProjectId is required");
        }

        // gọi service để upload
        ProjectFile savedFile = fileService.upload(file, projectId);

        return ResponseEntity.ok(savedFile);
    }
    @GetMapping("/{id}")
    public ResponseEntity<Resource> download(@PathVariable UUID id) {

        // lấy metadata từ DB
        ProjectFile file = fileService.getById(id);

        try {
            Path path = Paths.get(file.getFilePath());

            // check file có tồn tại không
            if (!path.toFile().exists()) {
                throw new RuntimeException("File not found on disk");
            }

            Resource resource = new UrlResource(path.toUri());

            // check resource có đọc được không
            if (!resource.exists() || !resource.isReadable()) {
                throw new RuntimeException("File cannot be read");
            }

            return ResponseEntity.ok()
                    // set content type (pdf / txt)
                    .contentType(MediaType.parseMediaType(file.getFileType()))

                    // bắt browser tải xuống
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + file.getFileName() + "\"")

                    .body(resource);

        } catch (Exception e) {
            throw new RuntimeException("Download failed: " + e.getMessage());
        }
    }
}