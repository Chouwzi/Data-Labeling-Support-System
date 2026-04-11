package com.uth.datalabeling.modules.activitylog.controller;

import com.uth.datalabeling.config.SecurityConfig;
import com.uth.datalabeling.modules.activitylog.dto.ActivityLogResponse;
import com.uth.datalabeling.modules.activitylog.repository.ActivityLogRepository;
import com.uth.datalabeling.modules.activitylog.service.ActivityLogService;
import com.uth.datalabeling.modules.iam.repository.UserRepository;
import com.uth.datalabeling.security.jwt.JwtAccessDeniedHandler;
import com.uth.datalabeling.security.jwt.JwtAuthenticationEntryPoint;
import com.uth.datalabeling.security.jwt.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ActivityLogController.class)
@Import({SecurityConfig.class, JwtAuthenticationEntryPoint.class, JwtAccessDeniedHandler.class})
class ActivityLogControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ActivityLogService service;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @MockitoBean
    private UserDetailsService userDetailsService;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private ActivityLogRepository activityLogRepository;

    private List<ActivityLogResponse> mockLogs;

    @BeforeEach
    void setUp() {
        mockLogs = List.of(ActivityLogResponse.builder()
                .action("VIEW_AUDIT_LOGS")
                .endpoint("/api/v1/audit-logs")
                .method("GET")
                .status(200)
                .ipAddress("127.0.0.1")
                .userId(UUID.randomUUID())
                .durationMs(8L)
                .createdAt(LocalDateTime.of(2026, 4, 11, 10, 15))
                .build());

        Mockito.when(service.getLogs(0, 20)).thenReturn(mockLogs);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getLogs_WithAdminRole_ReturnsOk() throws Exception {
        mockMvc.perform(get("/audit-logs").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result[0].action").value("VIEW_AUDIT_LOGS"))
                .andExpect(jsonPath("$.result[0].endpoint").value("/api/v1/audit-logs"));
    }

    @Test
    @WithMockUser(roles = "ANNOTATOR")
    void getLogs_WithNonAdminRole_ReturnsForbidden() throws Exception {
        mockMvc.perform(get("/audit-logs"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getLogs_WithoutAuth_ReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/audit-logs"))
                .andExpect(status().isUnauthorized());
    }
}