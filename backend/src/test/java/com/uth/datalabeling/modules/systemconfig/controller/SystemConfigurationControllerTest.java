package com.uth.datalabeling.modules.systemconfig.controller;

import com.uth.datalabeling.config.SecurityConfig;
import com.uth.datalabeling.modules.iam.repository.UserRepository;
import com.uth.datalabeling.modules.systemconfig.dto.response.SystemConfigurationResponse;
import com.uth.datalabeling.modules.systemconfig.service.SystemConfigurationService;
import com.uth.datalabeling.security.jwt.JwtAccessDeniedHandler;
import com.uth.datalabeling.security.jwt.JwtAuthenticationEntryPoint;
import com.uth.datalabeling.security.jwt.JwtTokenProvider;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SystemConfigurationController.class)
@Import({ SecurityConfig.class, JwtAuthenticationEntryPoint.class, JwtAccessDeniedHandler.class })
class SystemConfigurationControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @MockitoBean
  private SystemConfigurationService systemConfigurationService;

  @MockitoBean
  private JwtTokenProvider jwtTokenProvider;

  @MockitoBean
  private UserDetailsService userDetailsService;

  @MockitoBean
  private UserRepository userRepository;

  private String validUpdateJson;
  private SystemConfigurationResponse mockResponse;

  @BeforeEach
  void setUp() {
    validUpdateJson = """
        {
          "max_image_file_size_mb": 30,
          "ai_labeling_enabled": false,
          "default_page_size": 50,
          "allowed_image_extensions": ["jpg", "png", "webp"]
        }
        """;

    mockResponse = SystemConfigurationResponse.builder()
        .maxImageFileSizeMb(20)
        .aiLabelingEnabled(true)
        .defaultPageSize(25)
        .allowedImageExtensions(List.of("jpg", "jpeg", "png", "webp"))
        .updatedBy("admin@example.com")
        .build();

    Mockito.when(systemConfigurationService.getConfiguration()).thenReturn(mockResponse);
    Mockito.when(systemConfigurationService.updateConfiguration(Mockito.any(), Mockito.anyString()))
        .thenReturn(mockResponse);
  }

  @Test
  @WithMockUser(roles = "ADMIN")
  void getConfiguration_WithAdminRole_ReturnsOk() throws Exception {
    mockMvc.perform(get("/system-config"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.result.max_image_file_size_mb").value(20));
  }

  @Test
  @WithMockUser(roles = "ANNOTATOR")
  void getConfiguration_WithAuthenticatedUser_ReturnsOk() throws Exception {
    mockMvc.perform(get("/system-config"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.result.ai_labeling_enabled").value(true));
  }

  @Test
  @WithMockUser(roles = "ADMIN")
  void updateConfiguration_WithAdminRole_ReturnsOk() throws Exception {
    mockMvc.perform(put("/system-config")
        .contentType(MediaType.APPLICATION_JSON)
        .content(validUpdateJson))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.message").value("Đã cập nhật cấu hình hệ thống"));
  }

  @Test
  @WithMockUser(roles = "ANNOTATOR")
  void updateConfiguration_WithAnnotatorRole_ReturnsForbidden() throws Exception {
    mockMvc.perform(put("/system-config")
        .contentType(MediaType.APPLICATION_JSON)
        .content(validUpdateJson))
        .andExpect(status().isForbidden());
  }

  @Test
  void getConfiguration_WithoutAuth_ReturnsUnauthorized() throws Exception {
    mockMvc.perform(get("/system-config"))
        .andExpect(status().isUnauthorized());
  }
}
