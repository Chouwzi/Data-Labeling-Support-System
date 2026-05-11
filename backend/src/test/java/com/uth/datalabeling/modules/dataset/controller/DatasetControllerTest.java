package com.uth.datalabeling.modules.dataset.controller;

import com.uth.datalabeling.common.response.ApiResponse;
import com.uth.datalabeling.config.SecurityConfig;
import com.uth.datalabeling.modules.dataset.dto.request.DatasetRequest;
import com.uth.datalabeling.modules.dataset.dto.response.DatasetResponse;
import com.uth.datalabeling.modules.dataset.service.DatasetService;
import com.uth.datalabeling.modules.iam.repository.UserRepository;
import com.uth.datalabeling.security.jwt.JwtAccessDeniedHandler;
import com.uth.datalabeling.security.jwt.JwtAuthenticationEntryPoint;
import com.uth.datalabeling.security.jwt.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(DatasetController.class)
@Import({SecurityConfig.class, JwtAuthenticationEntryPoint.class, JwtAccessDeniedHandler.class})
public class DatasetControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private DatasetService datasetService;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @MockitoBean
    private UserDetailsService userDetailsService;

    @MockitoBean
    private UserRepository userRepository;

    private UUID datasetId;
    private DatasetResponse datasetResponse;

    @BeforeEach
    void setUp() {
        datasetId = UUID.randomUUID();
        datasetResponse = DatasetResponse.builder()
                .id(datasetId)
                .name("Test Dataset")
                .description("Test Description")
                .build();

        Mockito.when(datasetService.getAllDatasets()).thenReturn(List.of(datasetResponse));
        Mockito.when(datasetService.getDatasetById(datasetId)).thenReturn(datasetResponse);
        Mockito.when(datasetService.createDataset(any())).thenReturn(datasetResponse);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getAllDatasets_Success() throws Exception {
        mockMvc.perform(get("/datasets"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result[0].name").value("Test Dataset"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getDataset_Success() throws Exception {
        mockMvc.perform(get("/datasets/" + datasetId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.name").value("Test Dataset"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createDataset_Success() throws Exception {
        String json = """
                {
                    "name": "Test Dataset",
                    "description": "Test Description"
                }
                """;
        mockMvc.perform(post("/datasets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.name").value("Test Dataset"));
    }
}
