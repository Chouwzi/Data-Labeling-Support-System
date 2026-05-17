package com.uth.datalabeling.modules.review.controller;

import com.uth.datalabeling.common.response.PageResponse;
import com.uth.datalabeling.config.SecurityConfig;
import com.uth.datalabeling.modules.iam.repository.UserRepository;
import com.uth.datalabeling.modules.review.dto.response.ReviewQueueImageResponse;
import com.uth.datalabeling.modules.review.dto.response.ReviewQueueAnnotationResponse;
import com.uth.datalabeling.modules.review.service.ReviewQueueService;
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
import java.util.Map;
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

@WebMvcTest(ReviewQueueController.class)
@Import({SecurityConfig.class, JwtAuthenticationEntryPoint.class, JwtAccessDeniedHandler.class})
class ReviewQueueControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ReviewQueueService reviewQueueService;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @MockitoBean
    private UserDetailsService userDetailsService;

    @MockitoBean
    private UserRepository userRepository;

    @Test
    @WithMockUser(roles = "REVIEWER")
    void getReviewQueueImages_ReturnsPendingReviewImagesWithBoundingBoxes() throws Exception {
        UUID projectId = UUID.randomUUID();
        UUID taskId = UUID.randomUUID();
        UUID sampleId = UUID.randomUUID();
        UUID annotatorId = UUID.randomUUID();
        UUID annotationId = UUID.randomUUID();
        UUID labelId = UUID.randomUUID();
        LocalDateTime submittedAt = LocalDateTime.of(2026, 5, 16, 10, 30);

        ReviewQueueAnnotationResponse annotation = ReviewQueueAnnotationResponse.builder()
                .id(annotationId)
                .labelId(labelId)
                .labelName("Stop Sign")
                .colorHex("#FF0000")
                .shapeType("BOUNDING_BOX")
                .geometry(Map.of("x", 0.1, "y", 0.2, "width", 0.3, "height", 0.4))
                .isAiGenerated(false)
                .build();
        ReviewQueueImageResponse image = ReviewQueueImageResponse.builder()
                .taskId(taskId)
                .projectId(projectId)
                .projectName("Traffic Signs")
                .sampleId(sampleId)
                .imageUrl("uploads/traffic-001.jpg")
                .status("PENDING_REVIEW")
                .annotatorId(annotatorId)
                .annotatorName("Ann Labeler")
                .submittedAt(submittedAt)
                .annotations(List.of(annotation))
                .build();
        PageResponse<ReviewQueueImageResponse> response = PageResponse.<ReviewQueueImageResponse>builder()
                .currentPage(0)
                .totalPages(1)
                .pageSize(10)
                .totalElements(1)
                .data(List.of(image))
                .build();

        when(reviewQueueService.getPendingReviewImages(eq(projectId), any(Pageable.class))).thenReturn(response);

        mockMvc.perform(get("/review-queue/images")
                        .param("projectId", projectId.toString())
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.currentPage").value(0))
                .andExpect(jsonPath("$.result.totalElements").value(1))
                .andExpect(jsonPath("$.result.data[0].taskId").value(taskId.toString()))
                .andExpect(jsonPath("$.result.data[0].projectId").value(projectId.toString()))
                .andExpect(jsonPath("$.result.data[0].projectName").value("Traffic Signs"))
                .andExpect(jsonPath("$.result.data[0].sampleId").value(sampleId.toString()))
                .andExpect(jsonPath("$.result.data[0].imageUrl").value("uploads/traffic-001.jpg"))
                .andExpect(jsonPath("$.result.data[0].status").value("PENDING_REVIEW"))
                .andExpect(jsonPath("$.result.data[0].annotatorId").value(annotatorId.toString()))
                .andExpect(jsonPath("$.result.data[0].annotatorName").value("Ann Labeler"))
                .andExpect(jsonPath("$.result.data[0].submittedAt").value("2026-05-16T10:30:00"))
                .andExpect(jsonPath("$.result.data[0].annotations[0].id").value(annotationId.toString()))
                .andExpect(jsonPath("$.result.data[0].annotations[0].labelId").value(labelId.toString()))
                .andExpect(jsonPath("$.result.data[0].annotations[0].labelName").value("Stop Sign"))
                .andExpect(jsonPath("$.result.data[0].annotations[0].colorHex").value("#FF0000"))
                .andExpect(jsonPath("$.result.data[0].annotations[0].shapeType").value("BOUNDING_BOX"))
                .andExpect(jsonPath("$.result.data[0].annotations[0].geometry.x").value(0.1))
                .andExpect(jsonPath("$.result.data[0].annotations[0].geometry.y").value(0.2))
                .andExpect(jsonPath("$.result.data[0].annotations[0].geometry.width").value(0.3))
                .andExpect(jsonPath("$.result.data[0].annotations[0].geometry.height").value(0.4));

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(reviewQueueService).getPendingReviewImages(eq(projectId), pageableCaptor.capture());
        assertEquals(0, pageableCaptor.getValue().getPageNumber());
        assertEquals(10, pageableCaptor.getValue().getPageSize());
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void getReviewQueueImages_RejectsManagerRole() throws Exception {
        mockMvc.perform(get("/review-queue/images"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ANNOTATOR")
    void getReviewQueueImages_RejectsAnnotatorRole() throws Exception {
        mockMvc.perform(get("/review-queue/images"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getReviewQueueImages_RejectsAdminRole() throws Exception {
        mockMvc.perform(get("/review-queue/images"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "REVIEWER")
    void getReviewQueueImages_AllowsMissingProjectFilterAndReturnsEmptyPage() throws Exception {
        PageResponse<ReviewQueueImageResponse> response = PageResponse.<ReviewQueueImageResponse>builder()
                .currentPage(1)
                .totalPages(0)
                .pageSize(5)
                .totalElements(0)
                .data(List.of())
                .build();

        when(reviewQueueService.getPendingReviewImages(eq(null), any(Pageable.class))).thenReturn(response);

        mockMvc.perform(get("/review-queue/images")
                        .param("page", "1")
                        .param("size", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.currentPage").value(1))
                .andExpect(jsonPath("$.result.pageSize").value(5))
                .andExpect(jsonPath("$.result.totalElements").value(0))
                .andExpect(jsonPath("$.result.data").isEmpty());

        ArgumentCaptor<UUID> projectIdCaptor = ArgumentCaptor.forClass(UUID.class);
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(reviewQueueService).getPendingReviewImages(projectIdCaptor.capture(), pageableCaptor.capture());
        assertNull(projectIdCaptor.getValue());
        assertEquals(1, pageableCaptor.getValue().getPageNumber());
        assertEquals(5, pageableCaptor.getValue().getPageSize());
    }

    @Test
    void getReviewQueueImages_RejectsUnauthenticatedRequest() throws Exception {
        mockMvc.perform(get("/review-queue/images"))
                .andExpect(status().isUnauthorized());
    }
}
