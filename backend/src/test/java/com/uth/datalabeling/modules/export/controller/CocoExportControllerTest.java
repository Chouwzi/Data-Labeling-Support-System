package com.uth.datalabeling.modules.export.controller;

import com.uth.datalabeling.config.SecurityConfig;
import com.uth.datalabeling.modules.export.dto.*;
import com.uth.datalabeling.modules.export.service.CocoExportService;
import com.uth.datalabeling.modules.iam.repository.UserRepository;
import com.uth.datalabeling.security.jwt.JwtAccessDeniedHandler;
import com.uth.datalabeling.security.jwt.JwtAuthenticationEntryPoint;
import com.uth.datalabeling.security.jwt.JwtTokenProvider;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * RBAC and HTTP-layer tests for {@link CocoExportController}.
 * Validates that:
 *  - ADMIN and MANAGER get 200 with proper download headers
 *  - ANNOTATOR and REVIEWER get 403
 *  - Unauthenticated requests get 401
 */
@WebMvcTest(CocoExportController.class)
@Import({SecurityConfig.class, JwtAuthenticationEntryPoint.class, JwtAccessDeniedHandler.class})
@DisplayName("CocoExportController — RBAC tests")
class CocoExportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CocoExportService cocoExportService;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @MockitoBean
    private UserDetailsService userDetailsService;

    @MockitoBean
    private UserRepository userRepository;

    // ── 200 cases ──────────────────────────────────────────────────────────

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("ADMIN can export any project → 200 + JSON content type + attachment header")
    void exportCoco_asAdmin_returns200WithDownloadHeaders() throws Exception {
        UUID projectId = UUID.randomUUID();
        when(cocoExportService.buildExport(projectId)).thenReturn(emptyDto());

        mockMvc.perform(get("/projects/{id}/export/coco", projectId))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION,
                        org.hamcrest.Matchers.containsString("attachment")))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION,
                        org.hamcrest.Matchers.containsString(".json")));
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    @DisplayName("MANAGER can export their project → 200")
    void exportCoco_asManager_returns200() throws Exception {
        UUID projectId = UUID.randomUUID();
        when(cocoExportService.buildExport(projectId)).thenReturn(emptyDto());

        mockMvc.perform(get("/projects/{id}/export/coco", projectId))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("ADMIN can export COCO package → 200 + ZIP content type + attachment header")
    void exportCocoPackage_asAdmin_returnsZipDownload() throws Exception {
        UUID projectId = UUID.randomUUID();
        when(cocoExportService.buildExportPackage(projectId)).thenReturn("zip-bytes".getBytes(java.nio.charset.StandardCharsets.UTF_8));

        mockMvc.perform(get("/projects/{id}/export/coco.zip", projectId))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, "application/zip"))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION,
                        org.hamcrest.Matchers.containsString("attachment")))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION,
                        org.hamcrest.Matchers.containsString(".zip")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("Response body is valid JSON containing COCO keys")
    void exportCoco_responseBody_containsCocoStructure() throws Exception {
        UUID projectId = UUID.randomUUID();
        CocoExportDto dto = CocoExportDto.builder()
                .info(CocoInfo.builder()
                        .description("Test Project")
                        .version("1.0")
                        .year(2026)
                        .contributor("Data Labeling Support System")
                        .dateCreated("2026-05-17T18:00:00")
                        .build())
                .licenses(List.of())
                .categories(List.of(CocoCategory.builder().id(1).name("Stop Sign").supercategory("").build()))
                .images(List.of(CocoImage.builder().id(1).fileName("test.jpg").width(640).height(480).build()))
                .annotations(List.of(CocoAnnotation.builder()
                        .id(1).imageId(1).categoryId(1)
                        .bbox(List.of(96.0, 96.0, 192.0, 192.0))
                        .area(36864.0).iscrowd(0)
                        .build()))
                .build();
        when(cocoExportService.buildExport(projectId)).thenReturn(dto);

        mockMvc.perform(get("/projects/{id}/export/coco", projectId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.info").exists())
                .andExpect(jsonPath("$.info.description").value("Test Project"))
                .andExpect(jsonPath("$.categories[0].name").value("Stop Sign"))
                .andExpect(jsonPath("$.images[0].width").value(640))
                .andExpect(jsonPath("$.annotations[0].bbox[0]").value(96.0))
                .andExpect(jsonPath("$.annotations[0].image_id").value(1))
                .andExpect(jsonPath("$.annotations[0].category_id").value(1));
    }

    // ── 403 cases ──────────────────────────────────────────────────────────

    @Test
    @WithMockUser(roles = "ANNOTATOR")
    @DisplayName("ANNOTATOR cannot export → 403 Forbidden")
    void exportCoco_asAnnotator_returns403() throws Exception {
        mockMvc.perform(get("/projects/{id}/export/coco", UUID.randomUUID()))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "REVIEWER")
    @DisplayName("REVIEWER cannot export → 403 Forbidden")
    void exportCoco_asReviewer_returns403() throws Exception {
        mockMvc.perform(get("/projects/{id}/export/coco", UUID.randomUUID()))
                .andExpect(status().isForbidden());
    }

    // ── 401 cases ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("Unauthenticated request → 401 Unauthorized")
    void exportCoco_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/projects/{id}/export/coco", UUID.randomUUID()))
                .andExpect(status().isUnauthorized());
    }

    // ── Helper ─────────────────────────────────────────────────────────────

    private CocoExportDto emptyDto() {
        return CocoExportDto.builder()
                .info(CocoInfo.builder()
                        .description("Project")
                        .version("1.0")
                        .year(2026)
                        .contributor("System")
                        .dateCreated("2026-05-17T18:00:00")
                        .build())
                .licenses(List.of())
                .categories(List.of())
                .images(List.of())
                .annotations(List.of())
                .build();
    }
}
