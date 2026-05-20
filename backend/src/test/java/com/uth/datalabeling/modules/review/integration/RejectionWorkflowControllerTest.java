package com.uth.datalabeling.modules.review.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.uth.datalabeling.config.SecurityConfig;
import com.uth.datalabeling.modules.defect.controller.DefectCategoryController;
import com.uth.datalabeling.modules.defect.dto.request.DefectCategoryRequest;
import com.uth.datalabeling.modules.defect.dto.response.DefectCategoryResponse;
import com.uth.datalabeling.modules.defect.service.DefectCategoryService;
import com.uth.datalabeling.modules.review.controller.ReviewQueueController;
import com.uth.datalabeling.modules.review.dto.request.RejectImageRequest;
import com.uth.datalabeling.modules.review.service.ReviewQueueService;
import com.uth.datalabeling.security.jwt.JwtAccessDeniedHandler;
import com.uth.datalabeling.security.jwt.JwtAuthenticationEntryPoint;
import com.uth.datalabeling.security.jwt.JwtTokenProvider;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
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
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Controller-layer RBAC & Workflow Test (WebMvcTest + MockMvc, Security enforced)
 *
 * This test verifies the HTTP layer behavior for all four actors:
 *   ADMIN    → can fully manage DefectCategory (CRUD)
 *   MANAGER  → can read DefectCategory; can view and reject review queue
 *   REVIEWER → can read DefectCategory; can view and reject review queue
 *   ANNOTATOR→ forbidden from DefectCategory and review-queue endpoints
 *   PUBLIC   → 401 Unauthorized on all protected endpoints
 */
@WebMvcTest({DefectCategoryController.class, ReviewQueueController.class})
@Import({SecurityConfig.class, JwtAuthenticationEntryPoint.class, JwtAccessDeniedHandler.class})
@DisplayName("Rejection Workflow – Controller RBAC Test")
class RejectionWorkflowControllerTest {

    @Autowired MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean DefectCategoryService defectCategoryService;
    @MockitoBean ReviewQueueService reviewQueueService;
    @MockitoBean JwtTokenProvider jwtTokenProvider;
    @MockitoBean UserDetailsService userDetailsService;

    // ─── Shared test fixtures ─────────────────────────────────────────────────
    private final UUID categoryId = UUID.randomUUID();
    private final UUID taskId = UUID.randomUUID();

    private DefectCategoryRequest validCategoryRequest() {
        return DefectCategoryRequest.builder().name("Blurry Image").description("Too blurry to label").build();
    }

    private DefectCategoryResponse categoryResponse() {
        return DefectCategoryResponse.builder().id(categoryId).name("Blurry Image").description("Too blurry").build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. PUBLIC / UNAUTHENTICATED requests → 401
    // ─────────────────────────────────────────────────────────────────────────
    @Nested
    @DisplayName("1. Unauthenticated – all protected endpoints return 401")
    class UnauthenticatedRequests {

        @Test
        void defectCategories_list_unauthenticated_returns_401() throws Exception {
            mockMvc.perform(get("/defect-categories"))
                    .andDo(print())
                    .andExpect(status().isUnauthorized());
        }

        @Test
        void reviewQueue_list_unauthenticated_returns_401() throws Exception {
            mockMvc.perform(get("/review-queue/images"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        void reject_image_unauthenticated_returns_401() throws Exception {
            mockMvc.perform(post("/review-queue/images/{taskId}/reject", taskId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(new RejectImageRequest())))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        void approve_image_unauthenticated_returns_401() throws Exception {
            mockMvc.perform(post("/review-queue/images/{taskId}/approve", taskId))
                    .andExpect(status().isUnauthorized());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. ANNOTATOR – forbidden from defect categories & review queue
    // ─────────────────────────────────────────────────────────────────────────
    @Nested
    @DisplayName("2. ANNOTATOR – forbidden from all review and defect-category endpoints")
    class AnnotatorRequests {

        @Test
        @WithMockUser(roles = "ANNOTATOR")
        void annotator_cannot_list_defect_categories() throws Exception {
            mockMvc.perform(get("/defect-categories"))
                    .andExpect(status().isForbidden());
        }

        @Test
        @WithMockUser(roles = "ANNOTATOR")
        void annotator_cannot_create_defect_category() throws Exception {
            mockMvc.perform(post("/defect-categories")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(validCategoryRequest())))
                    .andExpect(status().isForbidden());
        }

        @Test
        @WithMockUser(roles = "ANNOTATOR")
        void annotator_cannot_access_review_queue() throws Exception {
            mockMvc.perform(get("/review-queue/images"))
                    .andExpect(status().isForbidden());
        }

        @Test
        @WithMockUser(roles = "ANNOTATOR")
        void annotator_cannot_reject_image() throws Exception {
            mockMvc.perform(post("/review-queue/images/{taskId}/reject", taskId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(new RejectImageRequest())))
                    .andExpect(status().isForbidden());
        }

        @Test
        @WithMockUser(roles = "ANNOTATOR")
        void annotator_cannot_approve_image() throws Exception {
            mockMvc.perform(post("/review-queue/images/{taskId}/approve", taskId))
                    .andExpect(status().isForbidden());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. ADMIN – full CRUD on DefectCategory, can also use review endpoints
    // ─────────────────────────────────────────────────────────────────────────
    @Nested
    @DisplayName("3. ADMIN – full CRUD on DefectCategory + review access")
    class AdminRequests {

        @Test
        @WithMockUser(roles = "ADMIN")
        void admin_can_list_defect_categories() throws Exception {
            when(defectCategoryService.getAllDefectCategories()).thenReturn(List.of(categoryResponse()));

            mockMvc.perform(get("/defect-categories"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(1000))
                    .andExpect(jsonPath("$.result[0].name").value("Blurry Image"));
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        void admin_can_get_defect_category_by_id() throws Exception {
            when(defectCategoryService.getDefectCategoryById(categoryId)).thenReturn(categoryResponse());

            mockMvc.perform(get("/defect-categories/{id}", categoryId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.result.id").value(categoryId.toString()));
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        void admin_can_create_defect_category() throws Exception {
            when(defectCategoryService.createDefectCategory(any())).thenReturn(categoryResponse());

            mockMvc.perform(post("/defect-categories")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(validCategoryRequest())))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.result.name").value("Blurry Image"));

            verify(defectCategoryService).createDefectCategory(any());
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        void admin_can_update_defect_category() throws Exception {
            when(defectCategoryService.updateDefectCategory(eq(categoryId), any())).thenReturn(categoryResponse());

            mockMvc.perform(put("/defect-categories/{id}", categoryId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(validCategoryRequest())))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.result.id").value(categoryId.toString()));
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        void admin_can_delete_defect_category() throws Exception {
            doNothing().when(defectCategoryService).deleteDefectCategory(categoryId);

            mockMvc.perform(delete("/defect-categories/{id}", categoryId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value("Defect category deleted successfully"));

            verify(defectCategoryService).deleteDefectCategory(categoryId);
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        void admin_can_reject_image() throws Exception {
            doNothing().when(reviewQueueService).rejectImage(eq(taskId), any());

            RejectImageRequest req = RejectImageRequest.builder()
                    .defectCategoryId(categoryId)
                    .comments("Out of focus")
                    .build();

            mockMvc.perform(post("/review-queue/images/{taskId}/reject", taskId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value("Image rejected successfully"));
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        void admin_can_approve_image() throws Exception {
            doNothing().when(reviewQueueService).approveImage(taskId);

            mockMvc.perform(post("/review-queue/images/{taskId}/approve", taskId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value("Image approved successfully"));

            verify(reviewQueueService).approveImage(taskId);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. MANAGER – can read DefectCategory and access review queue (own projects)
    // ─────────────────────────────────────────────────────────────────────────
    @Nested
    @DisplayName("4. MANAGER – read DefectCategory, access review queue")
    class ManagerRequests {

        @Test
        @WithMockUser(roles = "MANAGER")
        void manager_can_list_defect_categories() throws Exception {
            when(defectCategoryService.getAllDefectCategories()).thenReturn(List.of(categoryResponse()));

            mockMvc.perform(get("/defect-categories"))
                    .andExpect(status().isOk());
        }

        @Test
        @WithMockUser(roles = "MANAGER")
        void manager_cannot_create_defect_category() throws Exception {
            mockMvc.perform(post("/defect-categories")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(validCategoryRequest())))
                    .andExpect(status().isForbidden());

            // Service must NEVER be called
            verify(defectCategoryService, never()).createDefectCategory(any());
        }

        @Test
        @WithMockUser(roles = "MANAGER")
        void manager_cannot_delete_defect_category() throws Exception {
            mockMvc.perform(delete("/defect-categories/{id}", categoryId))
                    .andExpect(status().isForbidden());
        }

        @Test
        @WithMockUser(roles = "MANAGER")
        void manager_can_access_review_queue() throws Exception {
            mockMvc.perform(get("/review-queue/images"))
                    .andExpect(status().isOk());
        }

        @Test
        @WithMockUser(roles = "MANAGER")
        void manager_can_reject_image() throws Exception {
            doNothing().when(reviewQueueService).rejectImage(eq(taskId), any());

            RejectImageRequest req = RejectImageRequest.builder().comments("Bad quality").build();
            mockMvc.perform(post("/review-queue/images/{taskId}/reject", taskId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk());
        }

        @Test
        @WithMockUser(roles = "MANAGER")
        void manager_can_approve_image() throws Exception {
            doNothing().when(reviewQueueService).approveImage(taskId);

            mockMvc.perform(post("/review-queue/images/{taskId}/approve", taskId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value("Image approved successfully"));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. REVIEWER – can read DefectCategory and access review queue
    // ─────────────────────────────────────────────────────────────────────────
    @Nested
    @DisplayName("5. REVIEWER – read DefectCategory, reject images")
    class ReviewerRequests {

        @Test
        @WithMockUser(roles = "REVIEWER")
        void reviewer_can_list_defect_categories() throws Exception {
            when(defectCategoryService.getAllDefectCategories()).thenReturn(List.of(categoryResponse()));

            mockMvc.perform(get("/defect-categories"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.result").isArray());
        }

        @Test
        @WithMockUser(roles = "REVIEWER")
        void reviewer_cannot_create_defect_category() throws Exception {
            mockMvc.perform(post("/defect-categories")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(validCategoryRequest())))
                    .andExpect(status().isForbidden());
        }

        @Test
        @WithMockUser(roles = "REVIEWER")
        void reviewer_cannot_update_defect_category() throws Exception {
            mockMvc.perform(put("/defect-categories/{id}", categoryId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(validCategoryRequest())))
                    .andExpect(status().isForbidden());
        }

        @Test
        @WithMockUser(roles = "REVIEWER")
        void reviewer_cannot_delete_defect_category() throws Exception {
            mockMvc.perform(delete("/defect-categories/{id}", categoryId))
                    .andExpect(status().isForbidden());
        }

        @Test
        @WithMockUser(roles = "REVIEWER")
        void reviewer_can_view_review_queue() throws Exception {
            mockMvc.perform(get("/review-queue/images"))
                    .andExpect(status().isOk());
        }

        @Test
        @WithMockUser(roles = "REVIEWER")
        void reviewer_can_reject_image_with_category_and_comment() throws Exception {
            doNothing().when(reviewQueueService).rejectImage(eq(taskId), any());

            RejectImageRequest req = RejectImageRequest.builder()
                    .defectCategoryId(categoryId)
                    .comments("Image is blurry and unusable")
                    .build();

            mockMvc.perform(post("/review-queue/images/{taskId}/reject", taskId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value("Image rejected successfully"));

            verify(reviewQueueService).rejectImage(eq(taskId), any());
        }

        @Test
        @WithMockUser(roles = "REVIEWER")
        void reviewer_can_reject_image_without_category_comment_only() throws Exception {
            doNothing().when(reviewQueueService).rejectImage(eq(taskId), any());

            RejectImageRequest req = RejectImageRequest.builder().comments("Generic issue").build();
            mockMvc.perform(post("/review-queue/images/{taskId}/reject", taskId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk());
        }

        @Test
        @WithMockUser(roles = "REVIEWER")
        void reviewer_can_approve_image() throws Exception {
            doNothing().when(reviewQueueService).approveImage(taskId);

            mockMvc.perform(post("/review-queue/images/{taskId}/approve", taskId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value("Image approved successfully"));

            verify(reviewQueueService).approveImage(taskId);
        }
    }
}
