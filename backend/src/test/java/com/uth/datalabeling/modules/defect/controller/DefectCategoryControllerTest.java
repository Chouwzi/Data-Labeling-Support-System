package com.uth.datalabeling.modules.defect.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.uth.datalabeling.config.SecurityConfig;
import com.uth.datalabeling.modules.defect.dto.request.DefectCategoryRequest;
import com.uth.datalabeling.modules.defect.dto.response.DefectCategoryResponse;
import com.uth.datalabeling.modules.defect.service.DefectCategoryService;
import com.uth.datalabeling.security.jwt.JwtAccessDeniedHandler;
import com.uth.datalabeling.security.jwt.JwtAuthenticationEntryPoint;
import com.uth.datalabeling.security.jwt.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
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
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(DefectCategoryController.class)
@Import({SecurityConfig.class, JwtAuthenticationEntryPoint.class, JwtAccessDeniedHandler.class})
class DefectCategoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private DefectCategoryService defectCategoryService;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @MockitoBean
    private UserDetailsService userDetailsService;

    private DefectCategoryResponse response;
    private DefectCategoryRequest request;
    private UUID categoryId;

    @BeforeEach
    void setUp() {
        categoryId = UUID.randomUUID();
        response = DefectCategoryResponse.builder()
                .id(categoryId)
                .name("Blurry Image")
                .description("The image is too blurry")
                .build();
        
        request = DefectCategoryRequest.builder()
                .name("Incorrect Box")
                .description("Bounding box is completely off")
                .build();
    }

    @Test
    @WithMockUser(roles = "REVIEWER")
    void getAllDefectCategories_Success_AsReviewer() throws Exception {
        when(defectCategoryService.getAllDefectCategories()).thenReturn(List.of(response));

        mockMvc.perform(get("/defect-categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result[0].id").value(categoryId.toString()))
                .andExpect(jsonPath("$.result[0].name").value("Blurry Image"));
    }

    @Test
    @WithMockUser(roles = "ANNOTATOR")
    void getAllDefectCategories_Forbidden_AsAnnotator() throws Exception {
        mockMvc.perform(get("/defect-categories"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getDefectCategoryById_Success() throws Exception {
        when(defectCategoryService.getDefectCategoryById(categoryId)).thenReturn(response);

        mockMvc.perform(get("/defect-categories/{id}", categoryId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.id").value(categoryId.toString()))
                .andExpect(jsonPath("$.result.name").value("Blurry Image"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createDefectCategory_Success() throws Exception {
        when(defectCategoryService.createDefectCategory(any(DefectCategoryRequest.class))).thenReturn(response);

        mockMvc.perform(post("/defect-categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.id").value(categoryId.toString()));

        verify(defectCategoryService).createDefectCategory(any(DefectCategoryRequest.class));
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void createDefectCategory_Forbidden_AsManager() throws Exception {
        mockMvc.perform(post("/defect-categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateDefectCategory_Success() throws Exception {
        when(defectCategoryService.updateDefectCategory(eq(categoryId), any(DefectCategoryRequest.class))).thenReturn(response);

        mockMvc.perform(put("/defect-categories/{id}", categoryId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.id").value(categoryId.toString()));

        verify(defectCategoryService).updateDefectCategory(eq(categoryId), any(DefectCategoryRequest.class));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void deleteDefectCategory_Success() throws Exception {
        mockMvc.perform(delete("/defect-categories/{id}", categoryId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Defect category deleted successfully"));

        verify(defectCategoryService).deleteDefectCategory(categoryId);
    }
}
