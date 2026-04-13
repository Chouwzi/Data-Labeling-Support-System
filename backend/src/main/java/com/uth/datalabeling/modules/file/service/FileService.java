package com.uth.datalabeling.modules.file.service;

import com.uth.datalabeling.modules.file.entity.ProjectFile;
import com.uth.datalabeling.modules.file.repository.ProjectFileRepository;
import com.uth.datalabeling.modules.project.entity.Project;
import com.uth.datalabeling.modules.project.repository.ProjectRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class FileService {

    ProjectFileRepository repository;
    ProjectRepository projectRepository;

    String UPLOAD_DIR = "uploads/";

    public ProjectFile upload(MultipartFile file, UUID projectId) {

        // 0. CHECK PROJECT
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        // 1. VALIDATE FILE
        validateFile(file);

        try {

            // 2. CREATE FOLDER
            Path uploadPath = Paths.get(UPLOAD_DIR);

            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // 3. RENAME FILE
            String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();

            Path path = uploadPath.resolve(fileName).normalize();

            // 4. SAVE FILE
            Files.copy(
                    file.getInputStream(),
                    path,
                    StandardCopyOption.REPLACE_EXISTING
            );

            // 5. SAVE DB
            ProjectFile pf = ProjectFile.builder()
                    .fileName(file.getOriginalFilename())
                    .fileType(file.getContentType())
                    .filePath(path.toString())
                    .fileSize(file.getSize())
                    .project(project)
                    .build();

            return repository.save(pf);

        } catch (IOException e) {
            throw new RuntimeException("Upload failed", e);
        }
    }

    // VALIDATE FILE
    private void validateFile(MultipartFile file) {

        if (file.isEmpty()) {
            throw new RuntimeException("File is empty");
        }

        String type = file.getContentType();

        if (!"application/pdf".equals(type) &&
            !"text/plain".equals(type)) {
            throw new RuntimeException("Only PDF or TXT allowed");
        }

        long maxSize = 5 * 1024 * 1024;

        if (file.getSize() > maxSize) {
            throw new RuntimeException("File too large (max 5MB)");
        }
    }

    // GET FILE BY ID
    public ProjectFile getById(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("File not found"));
    }
}