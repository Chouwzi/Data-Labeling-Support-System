package com.uth.datalabeling.modules.image.controller;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import com.uth.datalabeling.modules.image.dto.response.ImageUploadResponse;
import com.uth.datalabeling.modules.image.service.ImageService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Security-aware controller tests for ImageController.
 *
 * Uses @WebMvcTest to load the Spring Security filter chain together with
 * the controller, so we can validate authentication/authorisation enforcement.
 *
 * All POST requests include .with(csrf()) to satisfy Spring Security 6's CSRF
 * protection. Without it, every POST returns 403 regardless of authentication.
 *
 * NOTE (Documented Bug FIXED):
 *   The controller previously declared @RequestMapping("/api/v1/images") but the app
 *   also has server.servlet.context-path=/api/v1, causing an effective double-prefix
 *   path /api/v1/api/v1/images/upload at runtime. Fixed to @RequestMapping("/images").
 *   Runtime URL is now correctly: /api/v1/images/upload
 *
 *   In @WebMvcTest, context-path is NOT applied, so the test URL is /images/upload
 *   (the raw controller mapping, without the context-path prefix).
 */
@WebMvcTest(ImageController.class)
@DisplayName("ImageController – Security & MVC Tests")
class ImageControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ImageService imageService;

    private static final String UPLOAD_URL = "/images/upload";

    // ============================================================
    // Authentication enforcement
    // ============================================================

    @Nested
    @DisplayName("Authentication enforcement")
    class AuthTests {

        @Test
        @WithAnonymousUser
        @DisplayName("Anonymous user (with CSRF) → 401 Unauthorized")
        void upload_AnonymousUser_Returns401() throws Exception {
            MockMultipartFile file = new MockMultipartFile(
                    "files", "photo.png", "image/png", "content".getBytes());

            mockMvc.perform(multipart(UPLOAD_URL)
                            .file(file)
                            .with(csrf())
                            .contentType(MediaType.MULTIPART_FORM_DATA))
                    .andExpect(status().isUnauthorized());

            verify(imageService, never()).uploadImages(any());
        }

        @Test
        @WithMockUser(username = "user@example.com")
        @DisplayName("Authenticated user (with CSRF) → service is called, 200 OK")
        void upload_AuthenticatedUser_ServiceIsCalled() throws Exception {
            ImageUploadResponse mockResp = ImageUploadResponse.builder()
                    .id(UUID.randomUUID())
                    .fileName("photo.png")
                    .filePath("https://res.cloudinary.com/demo/test.png")
                    .format("image/png")
                    .sizeBytes(1024L)
                    .build();

            when(imageService.uploadImages(any())).thenReturn(List.of(mockResp));

            MockMultipartFile file = new MockMultipartFile(
                    "files", "photo.png", "image/png", "content".getBytes());

            mockMvc.perform(multipart(UPLOAD_URL)
                            .file(file)
                            .with(csrf())
                            .contentType(MediaType.MULTIPART_FORM_DATA))
                    .andExpect(status().isOk());

            verify(imageService, times(1)).uploadImages(any());
        }

        @Test
        @WithMockUser
        @DisplayName("Authenticated user WITHOUT CSRF → 403 Forbidden (CSRF protection enforced)")
        void upload_AuthenticatedUser_NoCsrf_Returns403() throws Exception {
            MockMultipartFile file = new MockMultipartFile(
                    "files", "photo.png", "image/png", "content".getBytes());

            // No .with(csrf()) – verifies CSRF is actually enforced
            mockMvc.perform(multipart(UPLOAD_URL)
                            .file(file)
                            .contentType(MediaType.MULTIPART_FORM_DATA))
                    .andExpect(status().isForbidden());

            verify(imageService, never()).uploadImages(any());
        }
    }

    // ============================================================
    // Response structure
    // ============================================================

    @Nested
    @DisplayName("Response structure")
    class ResponseStructureTests {

        @Test
        @WithMockUser
        @DisplayName("Successful upload → ApiResponse with code=2000 and result list")
        void upload_Success_ResponseStructure() throws Exception {
            UUID id = UUID.randomUUID();
            ImageUploadResponse mockResp = ImageUploadResponse.builder()
                    .id(id)
                    .fileName("test.png")
                    .filePath("https://res.cloudinary.com/demo/test.png")
                    .format("image/png")
                    .sizeBytes(2048L)
                    .build();

            when(imageService.uploadImages(any())).thenReturn(List.of(mockResp));

            MockMultipartFile file = new MockMultipartFile(
                    "files", "test.png", "image/png", "content".getBytes());

            mockMvc.perform(multipart(UPLOAD_URL)
                            .file(file)
                            .with(csrf())
                            .contentType(MediaType.MULTIPART_FORM_DATA))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(2000))
                    .andExpect(jsonPath("$.message").value("Tải ảnh lên thành công"))
                    .andExpect(jsonPath("$.result").isArray())
                    .andExpect(jsonPath("$.result.length()").value(1))
                    .andExpect(jsonPath("$.result[0].fileName").value("test.png"))
                    .andExpect(jsonPath("$.result[0].filePath").value("https://res.cloudinary.com/demo/test.png"))
                    .andExpect(jsonPath("$.result[0].format").value("image/png"))
                    .andExpect(jsonPath("$.result[0].sizeBytes").value(2048));
        }

        @Test
        @WithMockUser
        @DisplayName("Multiple files upload → result list has multiple items")
        void upload_MultipleFiles_ResponseHasMultipleItems() throws Exception {
            List<ImageUploadResponse> mockResps = List.of(
                    ImageUploadResponse.builder().id(UUID.randomUUID()).fileName("a.png")
                            .filePath("/a").format("image/png").sizeBytes(100L).build(),
                    ImageUploadResponse.builder().id(UUID.randomUUID()).fileName("b.jpg")
                            .filePath("/b").format("image/jpeg").sizeBytes(200L).build()
            );
            when(imageService.uploadImages(any())).thenReturn(mockResps);

            MockMultipartFile file1 = new MockMultipartFile("files", "a.png", "image/png", "d1".getBytes());
            MockMultipartFile file2 = new MockMultipartFile("files", "b.jpg", "image/jpeg", "d2".getBytes());

            mockMvc.perform(multipart(UPLOAD_URL)
                            .file(file1).file(file2)
                            .with(csrf())
                            .contentType(MediaType.MULTIPART_FORM_DATA))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.result.length()").value(2))
                    .andExpect(jsonPath("$.result[0].fileName").value("a.png"))
                    .andExpect(jsonPath("$.result[1].fileName").value("b.jpg"));
        }
    }

    // ============================================================
    // Service error propagation
    // ============================================================

    @Nested
    @DisplayName("Service error propagation")
    class ErrorPropagationTests {

        @Test
        @WithMockUser
        @DisplayName("Service throws AppException(BAD_REQUEST) → 400 propagated")
        void upload_ServiceThrowsBadRequest_Returns400() throws Exception {
            when(imageService.uploadImages(any()))
                    .thenThrow(new AppException(ErrorCode.BAD_REQUEST));

            MockMultipartFile file = new MockMultipartFile(
                    "files", "bad.png", "image/png", new byte[1]);

            mockMvc.perform(multipart(UPLOAD_URL)
                            .file(file)
                            .with(csrf())
                            .contentType(MediaType.MULTIPART_FORM_DATA))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @WithMockUser
        @DisplayName("Service throws AppException(INVALID_FILE_FORMAT) → 400 propagated")
        void upload_InvalidFileFormat_Returns400() throws Exception {
            when(imageService.uploadImages(any()))
                    .thenThrow(new AppException(ErrorCode.INVALID_FILE_FORMAT));

            MockMultipartFile file = new MockMultipartFile(
                    "files", "fake.exe", "application/octet-stream", "MZ".getBytes());

            mockMvc.perform(multipart(UPLOAD_URL)
                            .file(file)
                            .with(csrf())
                            .contentType(MediaType.MULTIPART_FORM_DATA))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @WithMockUser
        @DisplayName("Service throws AppException(FILE_SIZE_EXCEEDS_LIMIT) → 400 propagated")
        void upload_FileSizeExceeds_Returns400() throws Exception {
            when(imageService.uploadImages(any()))
                    .thenThrow(new AppException(ErrorCode.FILE_SIZE_EXCEEDS_LIMIT));

            MockMultipartFile file = new MockMultipartFile(
                    "files", "huge.png", "image/png", new byte[100]);

            mockMvc.perform(multipart(UPLOAD_URL)
                            .file(file)
                            .with(csrf())
                            .contentType(MediaType.MULTIPART_FORM_DATA))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @WithMockUser
        @DisplayName("Service throws AppException(UPLOAD_FAILED) → 400 propagated [Known Issue: should be 5xx]")
        void upload_UploadFailed_Returns400() throws Exception {
            when(imageService.uploadImages(any()))
                    .thenThrow(new AppException(ErrorCode.UPLOAD_FAILED));

            MockMultipartFile file = new MockMultipartFile(
                    "files", "ok.png", "image/png", "content".getBytes());

            // UPLOAD_FAILED currently maps to HTTP 400 in ErrorCode enum
            // KNOWN ISSUE: a cloud upload failure should ideally be 502/503, not 400
            mockMvc.perform(multipart(UPLOAD_URL)
                            .file(file)
                            .with(csrf())
                            .contentType(MediaType.MULTIPART_FORM_DATA))
                    .andExpect(status().isBadRequest());
        }
    }

    // ============================================================
    // Content-type validation
    // ============================================================

    @Nested
    @DisplayName("Content-type enforcement")
    class ContentTypeTests {

        @Test
        @WithMockUser
        @DisplayName("Non-multipart request → 415 Unsupported Media Type")
        void upload_NonMultipart_Returns415() throws Exception {
            mockMvc.perform(
                            post(UPLOAD_URL)
                                    .with(csrf())
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content("{}")
                    )
                    .andExpect(status().isUnsupportedMediaType());
        }
    }
}
