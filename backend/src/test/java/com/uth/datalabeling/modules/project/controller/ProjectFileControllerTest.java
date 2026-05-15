package com.uth.datalabeling.modules.project.controller;

import com.uth.datalabeling.modules.project.entity.ProjectFile;
import com.uth.datalabeling.modules.project.service.ProjectFileService;
import com.uth.datalabeling.modules.project.entity.Project;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ProjectFileControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ProjectFileService projectFileService;

    @InjectMocks
    private ProjectFileController projectFileController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(projectFileController).build();
    }

    @Test
    void upload_Success() throws Exception {
        UUID projectId = UUID.randomUUID();
        UUID fileId = UUID.randomUUID();

        MockMultipartFile mockFile = new MockMultipartFile(
                "file", "test.pdf", "application/pdf", "content".getBytes()
        );

        ProjectFile projectFile = new ProjectFile();
        projectFile.setId(fileId);
        projectFile.setFileName("test.pdf");
        projectFile.setFileType("application/pdf");
        projectFile.setFileSize(7L);

        when(projectFileService.upload(any(), eq(projectId))).thenReturn(projectFile);

        mockMvc.perform(multipart("/projects/{projectId}/files", projectId)
                .file(mockFile)
                .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(fileId.toString()))
                .andExpect(jsonPath("$.fileName").value("test.pdf"))
                .andExpect(jsonPath("$.fileType").value("application/pdf"));
    }

    @Test
    void getFile_Success() throws Exception {
        UUID projectId = UUID.randomUUID();
        UUID fileId = UUID.randomUUID();
        
        Project project = new Project();
        project.setId(projectId);

        ProjectFile projectFile = new ProjectFile();
        projectFile.setId(fileId);
        projectFile.setFileName("test.pdf");
        projectFile.setProject(project);

        when(projectFileService.getByIdAndProjectId(fileId, projectId)).thenReturn(projectFile);

        mockMvc.perform(get("/projects/{projectId}/files/{id}", projectId, fileId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(fileId.toString()))
                .andExpect(jsonPath("$.fileName").value("test.pdf"));
    }

    @Test
    void getFile_Idor_ThrowsException() throws Exception {
        UUID wrongProjectId = UUID.randomUUID();
        UUID correctProjectId = UUID.randomUUID();
        UUID fileId = UUID.randomUUID();

        Project project = new Project();
        project.setId(correctProjectId);

        ProjectFile projectFile = new ProjectFile();
        projectFile.setId(fileId);
        projectFile.setProject(project);

        when(projectFileService.getByIdAndProjectId(fileId, wrongProjectId))
                .thenThrow(new com.uth.datalabeling.common.exception.AppException(com.uth.datalabeling.common.exception.ErrorCode.FORBIDDEN, "File không thuộc về project này"));

        // Expect Exception because GlobalExceptionHandler is not attached to this standalone mockMvc
        // So the nested exception AppException will be thrown and wrapped in nested exception
        try {
            mockMvc.perform(get("/projects/{projectId}/files/{id}", wrongProjectId, fileId));
        } catch (Exception e) {
            assertTrue(e.getCause().getMessage().contains("không thuộc về project này"));
        }
    }
}
