package com.uth.datalabeling.modules.project.controller;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import com.uth.datalabeling.config.SecurityConfig;
import com.uth.datalabeling.modules.iam.repository.UserRepository;
import com.uth.datalabeling.modules.project.dto.response.LabelResponse;
import com.uth.datalabeling.modules.project.service.LabelService;
import com.uth.datalabeling.security.jwt.JwtAccessDeniedHandler;
import com.uth.datalabeling.security.jwt.JwtAuthenticationEntryPoint;
import com.uth.datalabeling.security.jwt.JwtTokenProvider;
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

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(LabelController.class)
@Import({ SecurityConfig.class, JwtAuthenticationEntryPoint.class, JwtAccessDeniedHandler.class })
class LabelControllerTest {

        @Autowired
        private MockMvc mockMvc;

        @MockitoBean
        private LabelService labelService;

        @MockitoBean
        private JwtTokenProvider jwtTokenProvider;

        @MockitoBean
        private UserDetailsService userDetailsService;

        @MockitoBean
        private UserRepository userRepository;

        private UUID projectId;
        private UUID labelId;
        private LabelResponse labelResponse;
        private String validLabelJson;

        @BeforeEach
        void setUp() {
                projectId = UUID.randomUUID();
                labelId = UUID.randomUUID();

                labelResponse = LabelResponse.builder()
                                .id(labelId)
                                .name("Animal")
                                .colorHex("#FF0000")
                                .build();

                validLabelJson = """
                                {
                                  "name": "Animal",
                                  "color_hex": "#FF0000"
                                }
                                """;

                Mockito.when(labelService.createLabel(eq(projectId), any())).thenReturn(labelResponse);
                Mockito.when(labelService.getLabelsByProject(projectId)).thenReturn(List.of(labelResponse));
                Mockito.when(labelService.updateLabel(eq(projectId), eq(labelId), any())).thenReturn(labelResponse);
                Mockito.doNothing().when(labelService).deleteLabel(projectId, labelId);
        }

        @Test
        @WithMockUser(roles = "MANAGER")
        void createLabel_WithManagerRole_ReturnsCreated() throws Exception {
                mockMvc.perform(post("/projects/{projectId}/labels", projectId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(validLabelJson))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.result.name").value("Animal"));
        }

        @Test
        @WithMockUser(roles = "ANNOTATOR")
        void createLabel_WithAnnotatorRole_ReturnsForbidden() throws Exception {
                mockMvc.perform(post("/projects/{projectId}/labels", projectId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(validLabelJson))
                                .andExpect(status().isForbidden());
        }

        @Test
        @WithMockUser(roles = "ANNOTATOR")
        void getLabels_WithAnnotatorRole_ReturnsOk() throws Exception {
                mockMvc.perform(get("/projects/{projectId}/labels", projectId))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.result[0].name").value("Animal"));
        }

        @Test
        @WithMockUser(roles = "REVIEWER")
        void getLabels_WithReviewerRole_ReturnsOk() throws Exception {
                mockMvc.perform(get("/projects/{projectId}/labels", projectId))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.result[0].name").value("Animal"));
        }

        @Test
        @WithMockUser(roles = "MANAGER")
        void updateLabel_WithManagerRole_ReturnsOk() throws Exception {
                mockMvc.perform(put("/projects/{projectId}/labels/{id}", projectId, labelId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(validLabelJson))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.result.name").value("Animal"));
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        void deleteLabel_WithAdminRole_ReturnsOk() throws Exception {
                mockMvc.perform(delete("/projects/{projectId}/labels/{id}", projectId, labelId))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.message").value("Nhãn dán đã được xóa thành công."));
        }

        @Test
        @WithMockUser(roles = "MANAGER")
        void createLabel_WithInvalidColorHex_ReturnsUnprocessableEntity() throws Exception {
                String invalidJson = """
                                {
                                  "name": "Animal",
                                  "color_hex": "invalid"
                                }
                                """;

                mockMvc.perform(post("/projects/{projectId}/labels", projectId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(invalidJson))
                                .andExpect(status().isUnprocessableEntity());
        }

        @Test
        @WithMockUser(roles = "MANAGER")
        void updateLabel_WhenLabelNotFound_ReturnsNotFound() throws Exception {
                Mockito.when(labelService.updateLabel(eq(projectId), eq(labelId), any()))
                                .thenThrow(new AppException(ErrorCode.LABEL_NOT_FOUND));

                mockMvc.perform(put("/projects/{projectId}/labels/{id}", projectId, labelId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(validLabelJson))
                                .andExpect(status().isNotFound())
                                .andExpect(jsonPath("$.code").value(ErrorCode.LABEL_NOT_FOUND.getCode()));
        }
}
