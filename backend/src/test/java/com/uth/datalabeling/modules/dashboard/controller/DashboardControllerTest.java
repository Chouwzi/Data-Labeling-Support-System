package com.uth.datalabeling.modules.dashboard.controller;

import com.uth.datalabeling.config.SecurityConfig;
import com.uth.datalabeling.modules.dashboard.dto.response.AdminDashboardResponse;
import com.uth.datalabeling.modules.dashboard.dto.response.DashboardSummaryResponse;
import com.uth.datalabeling.modules.dashboard.dto.response.ManagerDashboardResponse;
import com.uth.datalabeling.modules.dashboard.service.DashboardService;
import com.uth.datalabeling.modules.iam.repository.UserRepository;
import com.uth.datalabeling.security.jwt.JwtAccessDeniedHandler;
import com.uth.datalabeling.security.jwt.JwtAuthenticationEntryPoint;
import com.uth.datalabeling.security.jwt.JwtTokenProvider;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(DashboardController.class)
@Import({SecurityConfig.class, JwtAuthenticationEntryPoint.class, JwtAccessDeniedHandler.class})
@DisplayName("DashboardController")
class DashboardControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    DashboardService dashboardService;
    @MockitoBean
    JwtTokenProvider jwtTokenProvider;
    @MockitoBean
    UserDetailsService userDetailsService;
    @MockitoBean
    UserRepository userRepository;

    @Test
    @WithMockUser(roles = "MANAGER")
    @DisplayName("MANAGER can read manager dashboard")
    void managerCanReadManagerDashboard() throws Exception {
        when(dashboardService.getManagerDashboard()).thenReturn(ManagerDashboardResponse.builder()
                .summary(DashboardSummaryResponse.builder().totalProjects(2).pendingReview(3).build())
                .taskPipeline(List.of())
                .projectHealth(List.of())
                .attentionQueue(List.of())
                .build());

        mockMvc.perform(get("/dashboard/manager"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.summary.totalProjects").value(2))
                .andExpect(jsonPath("$.result.summary.pendingReview").value(3));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("ADMIN can read admin dashboard")
    void adminCanReadAdminDashboard() throws Exception {
        when(dashboardService.getAdminDashboard()).thenReturn(AdminDashboardResponse.builder()
                .summary(DashboardSummaryResponse.builder().totalUsers(7).setupGaps(1).build())
                .roleBreakdown(List.of())
                .taskPipeline(List.of())
                .attentionQueue(List.of())
                .build());

        mockMvc.perform(get("/dashboard/admin"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.summary.totalUsers").value(7))
                .andExpect(jsonPath("$.result.summary.setupGaps").value(1));
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    @DisplayName("MANAGER cannot read admin dashboard")
    void managerCannotReadAdminDashboard() throws Exception {
        mockMvc.perform(get("/dashboard/admin"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ANNOTATOR")
    @DisplayName("ANNOTATOR cannot read manager dashboard")
    void annotatorCannotReadManagerDashboard() throws Exception {
        mockMvc.perform(get("/dashboard/manager"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "REVIEWER")
    @DisplayName("REVIEWER cannot read admin dashboard")
    void reviewerCannotReadAdminDashboard() throws Exception {
        mockMvc.perform(get("/dashboard/admin"))
                .andExpect(status().isForbidden());
    }
}
