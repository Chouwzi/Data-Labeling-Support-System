package com.uth.datalabeling.modules.project.controller;

import com.uth.datalabeling.config.SecurityConfig;
import com.uth.datalabeling.modules.iam.repository.UserRepository;
import com.uth.datalabeling.modules.project.dto.response.ProjectStatsResponse;
import com.uth.datalabeling.modules.project.service.ProjectStatsService;
import com.uth.datalabeling.security.jwt.JwtAccessDeniedHandler;
import com.uth.datalabeling.security.jwt.JwtAuthenticationEntryPoint;
import com.uth.datalabeling.security.jwt.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;
import java.util.UUID;

import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ProjectStatsController.class)
@Import({ SecurityConfig.class, JwtAuthenticationEntryPoint.class, JwtAccessDeniedHandler.class })
class ProjectStatsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ProjectStatsService projectStatsService;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @MockitoBean
    private UserDetailsService userDetailsService;

    @MockitoBean
    private UserRepository userRepository;

    @Test
    @WithMockUser(roles = "MANAGER")
    void getProjectStatistics_WithManagerRole_ReturnsStats() throws Exception {
        UUID projectId = UUID.randomUUID();
        ProjectStatsResponse response = new ProjectStatsResponse(
                10L,
                4L,
                3L,
                40.0,
                Map.of("DONE", 4L, "PENDING", 3L, "IN_PROGRESS", 3L));
        Mockito.when(projectStatsService.getProjectStatistics(projectId)).thenReturn(response);

        mockMvc.perform(get("/projects/{projectId}/statistics", projectId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.totalTasks").value(10))
                .andExpect(jsonPath("$.result.completedTasks").value(4))
                .andExpect(jsonPath("$.result.pendingTasks").value(3))
                .andExpect(jsonPath("$.result.completionPercentage").value(40.0))
                .andExpect(jsonPath("$.result.statusDistribution.DONE").value(4));

        verify(projectStatsService).getProjectStatistics(projectId);
    }

    @Test
    @WithMockUser(roles = "ANNOTATOR")
    void getProjectStatistics_WithAnnotatorRole_ReturnsForbidden() throws Exception {
        mockMvc.perform(get("/projects/{projectId}/statistics", UUID.randomUUID()))
                .andExpect(status().isForbidden());
    }

    @Test
    void getProjectStatistics_WithoutAuth_ReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/projects/{projectId}/statistics", UUID.randomUUID()))
                .andExpect(status().isUnauthorized());
    }
}
