package com.uth.datalabeling.modules.image.strategy;

import com.cloudinary.Cloudinary;
import com.cloudinary.Uploader;
import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.when;

/**
 * Extended tests for CloudinaryImageStorageStrategyImpl:
 * – verifies metadata population
 * – verifies fallback when Cloudinary returns null/missing fields
 * – verifies isPrimary() case-insensitivity
 *
 * LENIENT strictness is required because setUp() stubs cloudinary.uploader(),
 * which is NOT called by the isPrimary() tests.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("CloudinaryImageStorageStrategyImpl – Extended Tests")
class CloudinaryStrategyExtendedTest {

    @Mock
    private Cloudinary cloudinary;

    @Mock
    private Uploader uploader;

    @InjectMocks
    private CloudinaryImageStorageStrategyImpl strategy;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(strategy, "activeStrategy", "cloudinary");
        when(cloudinary.uploader()).thenReturn(uploader);
    }

    // ============================================================
    // Upload result correctness
    // ============================================================

    @Nested
    @DisplayName("Upload result mapping")
    class UploadResultMappingTests {

        @Test
        @DisplayName("filePath must be the secure_url from Cloudinary response")
        void upload_FilePath_IsSecureUrl() throws IOException {
            Map<String, Object> mockResult = new HashMap<>();
            mockResult.put("secure_url", "https://res.cloudinary.com/demo/image/upload/test.png");
            mockResult.put("format", "png");
            mockResult.put("bytes", 2048);

            when(uploader.upload(any(byte[].class), anyMap())).thenReturn(mockResult);

            MockMultipartFile file = new MockMultipartFile("file", "test.png", "image/png", "content".getBytes());
            Map<String, Object> result = strategy.upload(file);

            assertEquals("https://res.cloudinary.com/demo/image/upload/test.png", result.get("filePath"));
        }

        @Test
        @DisplayName("format must use file.getContentType(), NOT Cloudinary's format field")
        void upload_Format_UsesContentType_NotCloudinaryFormat() throws IOException {
            Map<String, Object> mockResult = new HashMap<>();
            mockResult.put("secure_url", "https://res.cloudinary.com/demo/image/upload/test.png");
            mockResult.put("format", "png"); // Cloudinary returns just "png"
            mockResult.put("bytes", 1024);

            when(uploader.upload(any(byte[].class), anyMap())).thenReturn(mockResult);

            MockMultipartFile file = new MockMultipartFile("file", "test.png", "image/png", "content".getBytes());
            Map<String, Object> result = strategy.upload(file);

            // Strategy should use "image/png" (MIME), not "png"
            assertEquals("image/png", result.get("format"));
        }

        @Test
        @DisplayName("sizeBytes must use Cloudinary bytes when provided")
        void upload_SizeBytes_FromCloudinaryBytes() throws IOException {
            Map<String, Object> mockResult = new HashMap<>();
            mockResult.put("secure_url", "https://res.cloudinary.com/demo/image/upload/test.png");
            mockResult.put("format", "png");
            mockResult.put("bytes", 99999); // Cloudinary compressed size

            when(uploader.upload(any(byte[].class), anyMap())).thenReturn(mockResult);

            MockMultipartFile file = new MockMultipartFile("file", "test.png", "image/png", new byte[12345]);
            Map<String, Object> result = strategy.upload(file);

            assertEquals(99999L, result.get("sizeBytes"));
        }

        @Test
        @DisplayName("sizeBytes falls back to file.getSize() when Cloudinary bytes field missing")
        void upload_SizeBytes_FallsBackToFileSize_WhenBytesMissing() throws IOException {
            Map<String, Object> mockResult = new HashMap<>();
            mockResult.put("secure_url", "https://res.cloudinary.com/demo/image/upload/test.png");
            mockResult.put("format", "png");
            // deliberately omit "bytes"

            when(uploader.upload(any(byte[].class), anyMap())).thenReturn(mockResult);

            byte[] content = "fallback-content".getBytes();
            MockMultipartFile file = new MockMultipartFile("file", "test.png", "image/png", content);
            Map<String, Object> result = strategy.upload(file);

            assertEquals((long) content.length, result.get("sizeBytes"));
        }

        @Test
        @DisplayName("metadata map must contain all keys from Cloudinary response")
        void upload_Metadata_ContainsAllCloudinaryResponseKeys() throws IOException {
            Map<String, Object> mockResult = new HashMap<>();
            mockResult.put("secure_url", "https://res.cloudinary.com/demo/image/upload/v1/test.png");
            mockResult.put("public_id", "test");
            mockResult.put("format", "png");
            mockResult.put("bytes", 1024);
            mockResult.put("width", 800);
            mockResult.put("height", 600);
            mockResult.put("resource_type", "image");

            when(uploader.upload(any(byte[].class), anyMap())).thenReturn(mockResult);

            MockMultipartFile file = new MockMultipartFile("file", "test.png", "image/png", "content".getBytes());
            Map<String, Object> result = strategy.upload(file);

            @SuppressWarnings("unchecked")
            Map<String, Object> metadata = (Map<String, Object>) result.get("metadata");

            assertNotNull(metadata, "metadata must not be null");
            assertTrue(metadata.containsKey("public_id"), "metadata must contain public_id");
            assertTrue(metadata.containsKey("secure_url"), "metadata must contain secure_url");
            assertTrue(metadata.containsKey("width"), "metadata must contain width");
            assertTrue(metadata.containsKey("height"), "metadata must contain height");
            assertTrue(metadata.containsKey("resource_type"), "metadata must contain resource_type");
        }

        @Test
        @DisplayName("result map always contains keys: filePath, format, sizeBytes, metadata")
        void upload_Result_ContainsAllRequiredKeys() throws IOException {
            Map<String, Object> mockResult = new HashMap<>();
            mockResult.put("secure_url", "https://res.cloudinary.com/demo/image/upload/test.png");
            mockResult.put("format", "png");
            mockResult.put("bytes", 1024);

            when(uploader.upload(any(byte[].class), anyMap())).thenReturn(mockResult);

            MockMultipartFile file = new MockMultipartFile("file", "test.png", "image/png", "content".getBytes());
            Map<String, Object> result = strategy.upload(file);

            assertAll(
                    () -> assertTrue(result.containsKey("filePath"), "must have filePath"),
                    () -> assertTrue(result.containsKey("format"), "must have format"),
                    () -> assertTrue(result.containsKey("sizeBytes"), "must have sizeBytes"),
                    () -> assertTrue(result.containsKey("metadata"), "must have metadata")
            );
        }
    }

    // ============================================================
    // Error handling
    // ============================================================

    @Nested
    @DisplayName("Error handling")
    class ErrorHandlingTests {

        @Test
        @DisplayName("IOException from Cloudinary → AppException(UPLOAD_FAILED)")
        void upload_IOException_ThrowsUploadFailed() throws IOException {
            when(uploader.upload(any(byte[].class), anyMap()))
                    .thenThrow(new IOException("network error"));

            MockMultipartFile file = new MockMultipartFile("file", "test.png", "image/png", "content".getBytes());

            AppException ex = assertThrows(AppException.class, () -> strategy.upload(file));
            assertEquals(ErrorCode.UPLOAD_FAILED, ex.getErrorCode());
        }
    }

    // ============================================================
    // isPrimary()
    // ============================================================

    @Nested
    @DisplayName("isPrimary() strategy detection")
    class IsPrimaryTests {

        @Test
        @DisplayName("'cloudinary' → isPrimary = true")
        void isPrimary_Cloudinary_True() {
            ReflectionTestUtils.setField(strategy, "activeStrategy", "cloudinary");
            assertTrue(strategy.isPrimary());
        }

        @Test
        @DisplayName("'CLOUDINARY' (uppercase) → isPrimary = true (case-insensitive)")
        void isPrimary_CloudinaryUppercase_True() {
            ReflectionTestUtils.setField(strategy, "activeStrategy", "CLOUDINARY");
            assertTrue(strategy.isPrimary());
        }

        @Test
        @DisplayName("'local' → isPrimary = false")
        void isPrimary_Local_False() {
            ReflectionTestUtils.setField(strategy, "activeStrategy", "local");
            assertFalse(strategy.isPrimary());
        }

        @Test
        @DisplayName("'' (empty) → isPrimary = false")
        void isPrimary_Empty_False() {
            ReflectionTestUtils.setField(strategy, "activeStrategy", "");
            assertFalse(strategy.isPrimary());
        }
    }
}
