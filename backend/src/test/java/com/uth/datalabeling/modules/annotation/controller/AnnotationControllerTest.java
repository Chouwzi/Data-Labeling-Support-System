package com.uth.datalabeling.modules.annotation.controller;

import com.uth.datalabeling.config.SecurityConfig;
import com.uth.datalabeling.modules.annotation.dto.response.AnnotationResponse;
import com.uth.datalabeling.modules.annotation.entity.AnnotationShapeType;
import com.uth.datalabeling.modules.annotation.service.AnnotationService;
import com.uth.datalabeling.modules.iam.repository.UserRepository;
import com.uth.datalabeling.security.jwt.JwtAccessDeniedHandler;
import com.uth.datalabeling.security.jwt.JwtAuthenticationEntryPoint;
import com.uth.datalabeling.security.jwt.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AnnotationController.class)
@Import({SecurityConfig.class, JwtAuthenticationEntryPoint.class, JwtAccessDeniedHandler.class})
class AnnotationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AnnotationService annotationService;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @MockitoBean
    private UserDetailsService userDetailsService;

    @MockitoBean
    private UserRepository userRepository;

    @Test
    @WithMockUser(roles = "ANNOTATOR")
    void saveAnnotations_ReturnsUpdatedAnnotationList() throws Exception {
        UUID taskId = UUID.randomUUID();
        UUID annotationId = UUID.randomUUID();
        UUID labelId = UUID.randomUUID();
        AnnotationResponse response = AnnotationResponse.builder()
                .id(annotationId)
                .taskId(taskId)
                .shapeType(AnnotationShapeType.BOUNDING_BOX)
                .labelId(labelId)
                .labelName("Stop Sign")
                .colorHex("#FF0000")
                .geometry(Map.of("x", 0.1, "y", 0.2, "width", 0.3, "height", 0.4))
                .isAiGenerated(false)
                .build();

        when(annotationService.saveAnnotations(eq(taskId), any())).thenReturn(List.of(response));

        mockMvc.perform(put("/tasks/{taskId}/annotations", taskId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validSaveJson(labelId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result[0].id").value(annotationId.toString()))
                .andExpect(jsonPath("$.result[0].task_id").value(taskId.toString()))
                .andExpect(jsonPath("$.result[0].shape_type").value("BOUNDING_BOX"))
                .andExpect(jsonPath("$.result[0].label_id").value(labelId.toString()))
                .andExpect(jsonPath("$.result[0].label_name").value("Stop Sign"))
                .andExpect(jsonPath("$.result[0].color_hex").value("#FF0000"))
                .andExpect(jsonPath("$.result[0].geometry.x").value(0.1))
                .andExpect(jsonPath("$.result[0].geometry.width").value(0.3));

        verify(annotationService).saveAnnotations(eq(taskId), any());
    }

    @Test
    @WithMockUser(roles = "REVIEWER")
    void saveAnnotations_RejectsReviewerRole() throws Exception {
        mockMvc.perform(put("/tasks/{taskId}/annotations", UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validSaveJson(UUID.randomUUID())))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "REVIEWER")
    void getAnnotations_AllowsReviewerRole() throws Exception {
        UUID taskId = UUID.randomUUID();
        UUID annotationId = UUID.randomUUID();
        UUID labelId = UUID.randomUUID();
        AnnotationResponse response = AnnotationResponse.builder()
                .id(annotationId)
                .taskId(taskId)
                .shapeType(AnnotationShapeType.BOUNDING_BOX)
                .labelId(labelId)
                .labelName("Stop Sign")
                .colorHex("#FF0000")
                .geometry(Map.of("x", 0.1, "y", 0.2, "width", 0.3, "height", 0.4))
                .build();

        when(annotationService.getAnnotations(taskId)).thenReturn(List.of(response));

        mockMvc.perform(get("/tasks/{taskId}/annotations", taskId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result[0].id").value(annotationId.toString()))
                .andExpect(jsonPath("$.result[0].label_name").value("Stop Sign"));
    }

    @Test
    @WithMockUser(roles = "ANNOTATOR")
    void saveAnnotations_RejectsInvalidGeometryByBeanValidation() throws Exception {
        String json = """
                {
                  "annotations": [
                    {
                      "shape_type": "BOUNDING_BOX",
                      "label_id": "%s",
                      "geometry": {},
                      "is_ai_generated": false
                    }
                  ],
                  "submit": false
                }
                """.formatted(UUID.randomUUID());

        mockMvc.perform(put("/tasks/{taskId}/annotations", UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void getAnnotations_RejectsUnauthenticatedRequest() throws Exception {
        mockMvc.perform(get("/tasks/{taskId}/annotations", UUID.randomUUID()))
                .andExpect(status().isUnauthorized());
    }

    private String validSaveJson(UUID labelId) {
        return """
                {
                  "annotations": [
                    {
                      "shape_type": "BOUNDING_BOX",
                      "label_id": "%s",
                      "geometry": {
                        "x": 0.1,
                        "y": 0.2,
                        "width": 0.3,
                        "height": 0.4
                      },
                      "is_ai_generated": false
                    }
                  ],
                  "submit": false
                }
                """.formatted(labelId);
    }
}
