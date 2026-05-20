package com.uth.datalabeling.modules.project.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.UUID;

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
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(MyProjectController.class)
@Import({ SecurityConfig.class, JwtAuthenticationEntryPoint.class, JwtAccessDeniedHandler.class })
class MyProjectControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    ProjectService projectService;

    @MockitoBean
    JwtTokenProvider jwtTokenProvider;

    @MockitoBean
    UserDetailsService userDetailsService;

    @MockitoBean
    UserRepository userRepository;

    @BeforeEach
    void setUp() {
        ProjectResponse project = ProjectResponse.builder()
                .id(UUID.randomUUID())
                .name("Assigned Project")
                .build();
        PageResponse<ProjectResponse> response = PageResponse.<ProjectResponse>builder()
                .currentPage(0)
                .totalPages(1)
                .pageSize(10)
                .totalElements(1)
                .data(List.of(project))
                .build();

        Mockito.when(projectService.getMyAssignedProjects(any())).thenReturn(response);
    }

    @Test
    @WithMockUser(roles = "ANNOTATOR")
    void getMyProjects_WithAnnotatorRole_ReturnsAssignedProjects() throws Exception {
        mockMvc.perform(get("/me/projects"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.data[0].name").value("Assigned Project"));
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void getMyProjects_WithManagerRole_ReturnsForbidden() throws Exception {
        mockMvc.perform(get("/me/projects"))
                .andExpect(status().isForbidden());
    }
}
