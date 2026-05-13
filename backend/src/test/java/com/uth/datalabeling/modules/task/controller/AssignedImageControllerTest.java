package com.uth.datalabeling.modules.task.controller;

import com.uth.datalabeling.common.response.PageResponse;
import com.uth.datalabeling.config.SecurityConfig;
import com.uth.datalabeling.modules.iam.repository.UserRepository;
import com.uth.datalabeling.modules.task.dto.response.AssignedImageResponse;
import com.uth.datalabeling.modules.task.service.TaskService;
import com.uth.datalabeling.security.jwt.JwtAccessDeniedHandler;
import com.uth.datalabeling.security.jwt.JwtAuthenticationEntryPoint;
import com.uth.datalabeling.security.jwt.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AssignedImageController.class)
@Import({SecurityConfig.class, JwtAuthenticationEntryPoint.class, JwtAccessDeniedHandler.class})
class AssignedImageControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TaskService taskService;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @MockitoBean
    private UserDetailsService userDetailsService;

    @MockitoBean
    private UserRepository userRepository;

    @Test
    @WithMockUser(roles = "ANNOTATOR")
    void getMyAssignedImages_ReturnsPagedAssignedImagesWithoutAnnotatorFields() throws Exception {
        UUID projectId = UUID.randomUUID();
        UUID taskId = UUID.randomUUID();
        UUID sampleId = UUID.randomUUID();
        LocalDateTime assignedAt = LocalDateTime.of(2026, 5, 13, 10, 25);
        AssignedImageResponse image = AssignedImageResponse.builder()
                .taskId(taskId)
                .projectId(projectId)
                .projectName("Traffic Sign Labeling")
                .sampleId(sampleId)
                .imageUrl("https://cdn.example.com/image-001.jpg")
                .status("ASSIGNED")
                .assignedAt(assignedAt)
                .build();
        PageResponse<AssignedImageResponse> response = PageResponse.<AssignedImageResponse>builder()
                .currentPage(0)
                .totalPages(1)
                .pageSize(10)
                .totalElements(1)
                .data(List.of(image))
                .build();

        when(taskService.getMyAssignedImages(eq(projectId), eq("ASSIGNED"), any(Pageable.class)))
                .thenReturn(response);

        mockMvc.perform(get("/me/assigned-images")
                        .param("projectId", projectId.toString())
                        .param("status", "ASSIGNED")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.currentPage").value(0))
                .andExpect(jsonPath("$.result.totalElements").value(1))
                .andExpect(jsonPath("$.result.data[0].taskId").value(taskId.toString()))
                .andExpect(jsonPath("$.result.data[0].projectId").value(projectId.toString()))
                .andExpect(jsonPath("$.result.data[0].projectName").value("Traffic Sign Labeling"))
                .andExpect(jsonPath("$.result.data[0].sampleId").value(sampleId.toString()))
                .andExpect(jsonPath("$.result.data[0].imageUrl").value("https://cdn.example.com/image-001.jpg"))
                .andExpect(jsonPath("$.result.data[0].status").value("ASSIGNED"))
                .andExpect(jsonPath("$.result.data[0].assignedAt").value("2026-05-13T10:25:00"))
                .andExpect(jsonPath("$.result.data[0].annotatorId").doesNotExist())
                .andExpect(jsonPath("$.result.data[0].annotatorName").doesNotExist());

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(taskService).getMyAssignedImages(eq(projectId), eq("ASSIGNED"), pageableCaptor.capture());
        assertEquals(0, pageableCaptor.getValue().getPageNumber());
        assertEquals(10, pageableCaptor.getValue().getPageSize());
    }

    @Test
    @WithMockUser(roles = "ANNOTATOR")
    void getMyAssignedImages_AllowsMissingOptionalFilters() throws Exception {
        PageResponse<AssignedImageResponse> response = PageResponse.<AssignedImageResponse>builder()
                .currentPage(0)
                .totalPages(0)
                .pageSize(10)
                .totalElements(0)
                .data(List.of())
                .build();
        when(taskService.getMyAssignedImages(eq(null), eq(null), any(Pageable.class))).thenReturn(response);

        mockMvc.perform(get("/me/assigned-images"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.data").isArray())
                .andExpect(jsonPath("$.result.totalElements").value(0));

        ArgumentCaptor<UUID> projectIdCaptor = ArgumentCaptor.forClass(UUID.class);
        verify(taskService).getMyAssignedImages(projectIdCaptor.capture(), eq(null), any(Pageable.class));
        assertNull(projectIdCaptor.getValue());
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void getMyAssignedImages_RejectsManagerRole() throws Exception {
        mockMvc.perform(get("/me/assigned-images"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getMyAssignedImages_RejectsUnauthenticatedRequest() throws Exception {
        mockMvc.perform(get("/me/assigned-images"))
                .andExpect(status().isUnauthorized());
    }
}
