package com.uth.datalabeling.modules.project.controller;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import com.uth.datalabeling.common.response.PageResponse;
import com.uth.datalabeling.config.SecurityConfig;
import com.uth.datalabeling.modules.iam.repository.UserRepository;
import com.uth.datalabeling.modules.project.dto.response.ProjectResponse;
import com.uth.datalabeling.modules.project.service.ProjectService;
import com.uth.datalabeling.security.jwt.JwtAccessDeniedHandler;
import com.uth.datalabeling.security.jwt.JwtAuthenticationEntryPoint;
import com.uth.datalabeling.security.jwt.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.InvalidDataAccessApiUsageException;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ProjectController.class)
@Import({ SecurityConfig.class, JwtAuthenticationEntryPoint.class, JwtAccessDeniedHandler.class })
class ProjectControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ProjectService projectService;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @MockitoBean
    private UserDetailsService userDetailsService;

    @MockitoBean
    private UserRepository userRepository;

    private UUID projectId;
    private ProjectResponse projectResponse;
    private String validCreateJson;
    private String validUpdateJson;

    @BeforeEach
    void setUp() {
        projectId = UUID.randomUUID();

        projectResponse = ProjectResponse.builder()
                .id(projectId)
                .name("Project A")
                .status("DRAFT")
                .build();

        validCreateJson = """
                {
                  "name": "Project A",
                  "description": "Demo project"
                }
                """;

        validUpdateJson = """
                {
                  "name": "Project A Updated",
                  "status": "ACTIVE"
                }
                """;

        PageResponse<ProjectResponse> pageResponse = PageResponse.<ProjectResponse>builder()
                .currentPage(0)
                .totalPages(1)
                .pageSize(10)
                .totalElements(1)
                .data(List.of(projectResponse))
                .build();

        Mockito.when(projectService.createProject(any())).thenReturn(projectResponse);
        Mockito.when(projectService.getAllProjects(any())).thenReturn(pageResponse);
        Mockito.when(projectService.getProjectById(projectId)).thenReturn(projectResponse);
        Mockito.when(projectService.updateProject(eq(projectId), any())).thenReturn(projectResponse);
        Mockito.doNothing().when(projectService).deleteProject(projectId);
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void createProject_WithManagerRole_ReturnsCreated() throws Exception {
        mockMvc.perform(post("/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validCreateJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.result.name").value("Project A"));
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void getAllProjects_WithManagerRole_ReturnsOk() throws Exception {
        mockMvc.perform(get("/projects")
                        .queryParam("page", "0")
                        .queryParam("size", "1")
                        .queryParam("sort", "createdAt,asc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.data[0].name").value("Project A"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getProjectById_WithAdminRole_ReturnsOk() throws Exception {
        mockMvc.perform(get("/projects/{id}", projectId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.id").value(projectId.toString()));
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void updateProject_WithManagerRole_ReturnsOk() throws Exception {
        mockMvc.perform(put("/projects/{id}", projectId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validUpdateJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.name").value("Project A"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void deleteProject_WithAdminRole_ReturnsOk() throws Exception {
        mockMvc.perform(delete("/projects/{id}", projectId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Dự án đã được xóa thành công."));
    }

    @Test
    @WithMockUser(roles = "ANNOTATOR")
    void getAllProjects_WithAnnotatorRole_ReturnsForbidden() throws Exception {
        mockMvc.perform(get("/projects"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ANNOTATOR")
    void getProjectById_WithAnnotatorRole_ReturnsOk() throws Exception {
        mockMvc.perform(get("/projects/{id}", projectId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.id").value(projectId.toString()));
    }

    @Test
    @WithMockUser(roles = "REVIEWER")
    void getProjectById_WithReviewerRole_ReturnsOk() throws Exception {
        mockMvc.perform(get("/projects/{id}", projectId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.id").value(projectId.toString()));
    }

    @Test
    @WithMockUser(roles = "ANNOTATOR")
    void getProjectById_WhenAnnotatorHasNoReadAccess_ReturnsForbidden() throws Exception {
        Mockito.when(projectService.getProjectById(projectId))
                .thenThrow(new AppException(ErrorCode.FORBIDDEN));

        mockMvc.perform(get("/projects/{id}", projectId))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(ErrorCode.FORBIDDEN.getCode()));
    }

    @Test
    void getAllProjects_WithoutAuth_ReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/projects"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void createProject_WithInvalidPayload_ReturnsUnprocessableEntity() throws Exception {
        String invalidJson = """
                {
                  "description": "missing name"
                }
                """;

        mockMvc.perform(post("/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void updateProject_WhenServiceThrowsConflict_ReturnsConflict() throws Exception {
        Mockito.when(projectService.updateProject(eq(projectId), any()))
                .thenThrow(new AppException(ErrorCode.CONFLICT));

        mockMvc.perform(put("/projects/{id}", projectId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validUpdateJson))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value(ErrorCode.CONFLICT.getCode()));
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void getAllProjects_WithInvalidSortExpression_ReturnsBadRequest() throws Exception {
        Mockito.when(projectService.getAllProjects(any()))
                .thenThrow(new InvalidDataAccessApiUsageException("invalid sort"));

        mockMvc.perform(get("/projects")
                        .queryParam("page", "0")
                        .queryParam("size", "1")
                        .queryParam("sort", "[\"createdAt,asc\"]"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(ErrorCode.BAD_REQUEST.getCode()));
    }
}
