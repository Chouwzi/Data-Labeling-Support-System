package com.uth.datalabeling.modules.project.controller;

import com.uth.datalabeling.config.SecurityConfig;
import com.uth.datalabeling.modules.iam.repository.UserRepository;
import com.uth.datalabeling.modules.project.entity.ProjectFile;
import com.uth.datalabeling.modules.project.service.ProjectFileService;
import com.uth.datalabeling.security.jwt.JwtAccessDeniedHandler;
import com.uth.datalabeling.security.jwt.JwtAuthenticationEntryPoint;
import com.uth.datalabeling.security.jwt.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ProjectFileController.class)
@Import({SecurityConfig.class, JwtAuthenticationEntryPoint.class, JwtAccessDeniedHandler.class})
class ProjectFileControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ProjectFileService projectFileService;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @MockitoBean
    private UserDetailsService userDetailsService;

    @MockitoBean
    private UserRepository userRepository;

    private UUID projectId;
    private UUID fileId;
    private ProjectFile projectFile;

    @BeforeEach
    void setUp() {
        projectId = UUID.randomUUID();
        fileId = UUID.randomUUID();

        projectFile = new ProjectFile();
        projectFile.setId(fileId);
        projectFile.setFileName("guideline.pdf");
        projectFile.setFileType("application/pdf");
        projectFile.setFileSize(7L);

        when(projectFileService.getByIdAndProjectId(fileId, projectId)).thenReturn(projectFile);
        when(projectFileService.upload(any(), eq(projectId))).thenReturn(projectFile);
    }

    @Test
    @WithMockUser(roles = "REVIEWER")
    void getProjectFile_AllowsReviewerRole() throws Exception {
        mockMvc.perform(get("/projects/{projectId}/files/{id}", projectId, fileId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(fileId.toString()))
                .andExpect(jsonPath("$.fileName").value("guideline.pdf"));
    }

    @Test
    @WithMockUser(roles = "ANNOTATOR")
    void getProjectFile_AllowsAnnotatorRole() throws Exception {
        mockMvc.perform(get("/projects/{projectId}/files/{id}", projectId, fileId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(fileId.toString()));
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void uploadProjectFile_AllowsManagerRole() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "guideline.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                "content".getBytes());

        mockMvc.perform(multipart("/projects/{projectId}/files", projectId)
                        .file(file)
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(fileId.toString()));
    }

    @Test
    @WithMockUser(roles = "REVIEWER")
    void uploadProjectFile_RejectsReviewerRole() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "guideline.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                "content".getBytes());

        mockMvc.perform(multipart("/projects/{projectId}/files", projectId)
                        .file(file)
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isForbidden());
    }

    @Test
    void getProjectFile_RejectsUnauthenticatedRequest() throws Exception {
        mockMvc.perform(get("/projects/{projectId}/files/{id}", projectId, fileId))
                .andExpect(status().isUnauthorized());
    }
}
