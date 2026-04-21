package com.uth.datalabeling.modules.project.service;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import com.uth.datalabeling.common.storage.StorageService;
import com.uth.datalabeling.modules.project.entity.ProjectFile;
import com.uth.datalabeling.modules.project.repository.ProjectFileRepository;
import com.uth.datalabeling.modules.project.entity.Project;
import com.uth.datalabeling.modules.project.repository.ProjectRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProjectFileService {

    ProjectFileRepository repository;
    ProjectRepository projectRepository;
    StorageService storageService;

    public ProjectFile upload(MultipartFile file, UUID projectId) {

        // Check project tồn tại
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new AppException(ErrorCode.PROJECT_NOT_FOUND));

        // validate định dạng, dung lượng
        validateFile(file);

        // Uỷ quyền việc lưu trữ cho StorageService
        String filePath = storageService.store(file, "projects");

        // Lưu thông tin file vào database
        ProjectFile pf = ProjectFile.builder()
                .fileName(file.getOriginalFilename())
                .fileType(file.getContentType())
                .filePath(filePath)
                .fileSize(file.getSize())
                .project(project)
                .build();

        ProjectFile savedFile = repository.saveAndFlush(pf);

        // sync project guideline
        project.setGuidelineUrl(savedFile.getFilePath());
        projectRepository.save(project);

        return savedFile;
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "File không được để trống");
        }

        String type = file.getContentType();
        String originalFilename = file.getOriginalFilename();

        if (!"application/pdf".equals(type) && !"text/plain".equals(type)) {
            throw new AppException(ErrorCode.UNSUPPORTED_MEDIA_TYPE, "Chỉ hỗ trợ PDF và TXT");
        }

        if (originalFilename != null) {
            String lowerCaseName = originalFilename.toLowerCase();
            if (!lowerCaseName.endsWith(".pdf") && !lowerCaseName.endsWith(".txt")) {
                throw new AppException(ErrorCode.UNSUPPORTED_MEDIA_TYPE, "Chỉ hỗ trợ file có đuôi .pdf hoặc .txt");
            }
        }

        long maxSize = 5 * 1024 * 1024;
        if (file.getSize() > maxSize) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Kích thước file vượt quá 5MB");
        }
    }

    public ProjectFile getById(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Không tìm thấy file"));
    }

    /**
     * Lấy file theo ID và xác minh file thuộc về đúng project.
     */
    public ProjectFile getByIdAndProjectId(UUID fileId, UUID projectId) {
        ProjectFile file = getById(fileId);

        if (!file.getProject().getId().equals(projectId)) {
            throw new AppException(ErrorCode.NOT_FOUND, "File không thuộc về project này");
        }

        return file;
    }
}
