package com.uth.datalabeling.modules.annotation.controller;

import com.uth.datalabeling.config.SecurityConfig;
import com.uth.datalabeling.modules.annotation.dto.response.AnnotationResponse;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
    void submitAnnotation_ReturnsCreatedResponse() throws Exception {
        UUID taskId = UUID.randomUUID();
        UUID annotationId = UUID.randomUUID();
        UUID annotatorId = UUID.randomUUID();
        UUID labelId = UUID.randomUUID();
        LocalDateTime submittedAt = LocalDateTime.of(2026, 5, 13, 10, 25);
        List<Map<String, Object>> result = List.of(Map.of(
                "type", "BOUNDING_BOX",
                "label_id", labelId.toString(),
                "geometry", Map.of("x", 20, "y", 30, "width", 50, "height", 60)
        ));
        AnnotationResponse response = AnnotationResponse.builder()
                .id(annotationId)
                .taskId(taskId)
                .annotatorId(annotatorId)
                .status("SUBMITTED")
                .result(result)
                .leadTimeSeconds(42)
                .submittedAt(submittedAt)
                .build();

        when(annotationService.submitAnnotation(eq(taskId), any())).thenReturn(response);

        String json = """
                {
                  "result": [
                    {
                      "type": "BOUNDING_BOX",
                      "label_id": "%s",
                      "geometry": {
                        "x": 20,
                        "y": 30,
                        "width": 50,
                        "height": 60
                      }
                    }
                  ],
                  "lead_time_seconds": 42
                }
                """.formatted(labelId);

        mockMvc.perform(post("/tasks/" + taskId + "/annotations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value(201))
                .andExpect(jsonPath("$.message").value("Annotation submitted successfully."))
                .andExpect(jsonPath("$.result.id").value(annotationId.toString()))
                .andExpect(jsonPath("$.result.taskId").value(taskId.toString()))
                .andExpect(jsonPath("$.result.annotatorId").value(annotatorId.toString()))
                .andExpect(jsonPath("$.result.status").value("SUBMITTED"))
                .andExpect(jsonPath("$.result.result[0].type").value("BOUNDING_BOX"))
                .andExpect(jsonPath("$.result.result[0].label_id").value(labelId.toString()))
                .andExpect(jsonPath("$.result.result[0].geometry.x").value(20))
                .andExpect(jsonPath("$.result.leadTimeSeconds").value(42))
                .andExpect(jsonPath("$.result.submittedAt").value("2026-05-13T10:25:00"));

        verify(annotationService).submitAnnotation(eq(taskId), any());
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void submitAnnotation_RejectsManagerRole() throws Exception {
        mockMvc.perform(post("/tasks/" + UUID.randomUUID() + "/annotations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validJson(UUID.randomUUID())))
                .andExpect(status().isForbidden());
    }

    @Test
    void submitAnnotation_RejectsUnauthenticatedRequest() throws Exception {
        mockMvc.perform(post("/tasks/" + UUID.randomUUID() + "/annotations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validJson(UUID.randomUUID())))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "ANNOTATOR")
    void submitAnnotation_RejectsEmptyResult() throws Exception {
        String json = """
                {
                  "result": [],
                  "lead_time_seconds": 42
                }
                """;

        mockMvc.perform(post("/tasks/" + UUID.randomUUID() + "/annotations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "ANNOTATOR")
    void submitAnnotation_AllowsNullImageWithEmptyResult() throws Exception {
        UUID taskId = UUID.randomUUID();
        UUID annotationId = UUID.randomUUID();
        UUID annotatorId = UUID.randomUUID();
        LocalDateTime submittedAt = LocalDateTime.of(2026, 5, 13, 11, 10);
        AnnotationResponse response = AnnotationResponse.builder()
                .id(annotationId)
                .taskId(taskId)
                .annotatorId(annotatorId)
                .status("SUBMITTED")
                .result(List.of())
                .isNull(true)
                .leadTimeSeconds(12)
                .submittedAt(submittedAt)
                .build();

        when(annotationService.submitAnnotation(eq(taskId), any())).thenReturn(response);

        String json = """
                {
                  "result": [],
                  "is_null": true,
                  "lead_time_seconds": 12
                }
                """;

        mockMvc.perform(post("/tasks/" + taskId + "/annotations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.result.result").isEmpty())
                .andExpect(jsonPath("$.result.isNull").value(true))
                .andExpect(jsonPath("$.result.leadTimeSeconds").value(12));
    }

    private String validJson(UUID labelId) {
        return """
                {
                  "result": [
                    {
                      "type": "BOUNDING_BOX",
                      "label_id": "%s",
                      "geometry": {"x": 20, "y": 30, "width": 50, "height": 60}
                    }
                  ],
                  "lead_time_seconds": 42
                }
                """.formatted(labelId);
    }
}
