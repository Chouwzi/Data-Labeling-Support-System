package com.uth.datalabeling.modules.project.controller;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import com.uth.datalabeling.modules.project.dto.response.FileResponse;
import com.uth.datalabeling.modules.project.entity.ProjectFile;
import com.uth.datalabeling.modules.project.service.ProjectFileService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/projects/{projectId}/files")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProjectFileController {

    ProjectFileService projectFileService;

    // UPLOAD GUIDELINE FILE CHO PROJECT
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<FileResponse> upload(
            @PathVariable UUID projectId,
            @RequestParam("file") MultipartFile file
    ) {

        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "File không được để trống");
        }

        ProjectFile savedFile = projectFileService.upload(file, projectId);

        FileResponse response = FileResponse.builder()
                .id(savedFile.getId())
                .fileName(savedFile.getFileName())
                .fileType(savedFile.getFileType())
                .fileSize(savedFile.getFileSize())
                .build();

        return ResponseEntity.ok(response);
    }

    // GET GUIDELINE FILE BY ID
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'ANNOTATOR', 'REVIEWER')")
    public ResponseEntity<ProjectFile> getFile(
            @PathVariable UUID projectId, 
            @PathVariable UUID id) {

        // Lấy file theo id
        ProjectFile file = projectFileService.getById(id);
        
        // Xác minh file thuộc về đúng project
        if(!file.getProject().getId().equals(projectId)) {
            throw new AppException(ErrorCode.NOT_FOUND, "File không thuộc về project này");
        }

        return ResponseEntity.ok(file);
    }
}
