package com.uth.datalabeling.modules.project.service;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import com.uth.datalabeling.common.storage.StorageService;
import com.uth.datalabeling.modules.project.entity.ProjectFile;
import com.uth.datalabeling.modules.project.repository.ProjectFileRepository;
import com.uth.datalabeling.modules.project.entity.Project;
import com.uth.datalabeling.modules.project.repository.ProjectRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProjectFileServiceTest {

    @Mock
    private ProjectFileRepository projectFileRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private StorageService storageService;

    @InjectMocks
    private ProjectFileService projectFileService;

    @Test
    void upload_Success() {
        UUID projectId = UUID.randomUUID();
        Project project = new Project();
        project.setId(projectId);

        MockMultipartFile mockFile = new MockMultipartFile(
                "file", "guideline.pdf", "application/pdf", "dummy content".getBytes()
        );

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(storageService.store(mockFile, "projects")).thenReturn("/uploads/projects/123_guideline.pdf");
        
        when(projectFileRepository.saveAndFlush(any(ProjectFile.class))).thenAnswer(invocation -> {
            ProjectFile pf = invocation.getArgument(0);
            pf.setId(UUID.randomUUID());
            return pf;
        });

        ProjectFile savedFile = projectFileService.upload(mockFile, projectId);

        assertNotNull(savedFile);
        assertEquals("guideline.pdf", savedFile.getFileName());
        assertEquals("application/pdf", savedFile.getFileType());
        assertEquals("/uploads/projects/123_guideline.pdf", savedFile.getFilePath());

        verify(storageService, times(1)).store(mockFile, "projects");
        verify(projectRepository, times(1)).save(project);
        assertEquals("/uploads/projects/123_guideline.pdf", project.getGuidelineUrl());
    }

    @Test
    void upload_ProjectNotFound_ThrowsException() {
        UUID projectId = UUID.randomUUID();
        MockMultipartFile mockFile = new MockMultipartFile(
                "file", "test.pdf", "application/pdf", "content".getBytes()
        );

        when(projectRepository.findById(projectId)).thenReturn(Optional.empty());

        AppException exception = assertThrows(AppException.class, () -> {
            projectFileService.upload(mockFile, projectId);
        });

        assertEquals(ErrorCode.PROJECT_NOT_FOUND, exception.getErrorCode());
        verify(storageService, never()).store(any(), any());
    }

    @Test
    void upload_InvalidExtension_ThrowsException() {
        UUID projectId = UUID.randomUUID();
        Project project = new Project();
        project.setId(projectId);

        MockMultipartFile mockFile = new MockMultipartFile(
                "file", "script.exe", "application/pdf", "content".getBytes()
        );

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));

        AppException exception = assertThrows(AppException.class, () -> {
            projectFileService.upload(mockFile, projectId);
        });

        assertEquals(ErrorCode.UNSUPPORTED_MEDIA_TYPE, exception.getErrorCode());
        assertTrue(exception.getMessage().contains(".pdf hoặc .txt"));
    }

    @Test
    void upload_InvalidContentType_ThrowsException() {
        UUID projectId = UUID.randomUUID();
        Project project = new Project();
        project.setId(projectId);

        MockMultipartFile mockFile = new MockMultipartFile(
                "file", "test.pdf", "image/png", "content".getBytes()
        );

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));

        AppException exception = assertThrows(AppException.class, () -> {
            projectFileService.upload(mockFile, projectId);
        });

        assertEquals(ErrorCode.UNSUPPORTED_MEDIA_TYPE, exception.getErrorCode());
    }

    @Test
    void upload_EmptyFile_ThrowsException() {
        UUID projectId = UUID.randomUUID();
        Project project = new Project();
        project.setId(projectId);

        MockMultipartFile mockFile = new MockMultipartFile(
                "file", "test.pdf", "application/pdf", new byte[0]
        );

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));

        AppException exception = assertThrows(AppException.class, () -> {
            projectFileService.upload(mockFile, projectId);
        });

        assertEquals(ErrorCode.VALIDATION_ERROR, exception.getErrorCode());
    }

    @Test
    void getById_Success() {
        UUID fileId = UUID.randomUUID();
        ProjectFile projectFile = new ProjectFile();
        projectFile.setId(fileId);

        when(projectFileRepository.findById(fileId)).thenReturn(Optional.of(projectFile));

        ProjectFile result = projectFileService.getById(fileId);
        assertEquals(fileId, result.getId());
    }
}
