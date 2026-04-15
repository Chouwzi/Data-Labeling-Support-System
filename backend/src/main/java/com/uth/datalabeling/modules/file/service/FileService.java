package com.uth.datalabeling.modules.file.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.uth.datalabeling.modules.file.entity.ProjectFile;
import com.uth.datalabeling.modules.file.repository.ProjectFileRepository;
import com.uth.datalabeling.modules.project.entity.Project;
import com.uth.datalabeling.modules.project.repository.ProjectRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class FileService {

    final ProjectFileRepository repository;
    final ProjectRepository projectRepository;

    @Value("${app.upload.dir}")
    String uploadDir;

    public ProjectFile upload(MultipartFile file, UUID projectId) {

        // Check project tồn tại
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        // validate file
        validateFile(file);

        try {

            // tạo folder upload nếu chưa có
            Path uploadPath = Paths.get(uploadDir);

            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // rename file
            String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();

            Path path = uploadPath.resolve(fileName).normalize();

            // save file
            Files.copy(
                    file.getInputStream(),
                    path,
                    StandardCopyOption.REPLACE_EXISTING
            );

            // save db
            ProjectFile pf = ProjectFile.builder()
                    .fileName(file.getOriginalFilename())
                    .fileType(file.getContentType())
                    .filePath(path.toString())
                    .fileSize(file.getSize())
                    .project(project)
                    .build();

            ProjectFile savedFile = repository.saveAndFlush(pf);

            // sync project guideline
            project.setGuidelineUrl(savedFile.getFilePath());
            projectRepository.save(project);

            return savedFile;

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