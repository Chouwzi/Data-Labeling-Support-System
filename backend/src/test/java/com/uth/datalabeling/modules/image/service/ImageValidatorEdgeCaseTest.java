package com.uth.datalabeling.modules.image.service;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import com.uth.datalabeling.modules.systemconfig.dto.response.SystemConfigurationResponse;
import com.uth.datalabeling.modules.systemconfig.service.SystemConfigurationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Arrays;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

/**
 * Edge-case tests for ImageValidator – covers paths not addressed by the base ImageValidatorTest.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ImageValidator – Edge Cases")
class ImageValidatorEdgeCaseTest {

    @Mock
    private SystemConfigurationService systemConfigurationService;

    @InjectMocks
    private ImageValidator imageValidator;

    private SystemConfigurationResponse mockConfig;

    @BeforeEach
    void setUp() {
        mockConfig = SystemConfigurationResponse.builder()
                .maxImageFileSizeMb(5)
                .allowedImageExtensions(Arrays.asList("jpg", "jpeg", "png", "webp"))
                .build();
    }

    // ============================================================
    // Null / empty file guards
    // ============================================================

    @Nested
    @DisplayName("Null and empty file guards")
    class NullAndEmptyFileTests {

        @Test
        @DisplayName("null file → BAD_REQUEST")
        void validateImage_NullFile_ThrowsBadRequest() {
            AppException ex = assertThrows(AppException.class,
                    () -> imageValidator.validateImage(null));
            assertEquals(ErrorCode.BAD_REQUEST, ex.getErrorCode());
        }

        @Test
        @DisplayName("empty byte[] → BAD_REQUEST")
        void validateImage_ZeroLengthBytes_ThrowsBadRequest() {
            MockMultipartFile file = new MockMultipartFile("file", "empty.png", "image/png", new byte[0]);
            AppException ex = assertThrows(AppException.class,
                    () -> imageValidator.validateImage(file));
            assertEquals(ErrorCode.BAD_REQUEST, ex.getErrorCode());
        }
    }

    // ============================================================
    // Filename / extension edge cases
    // ============================================================

    @Nested
    @DisplayName("Filename and extension validation")
    class ExtensionValidationTests {

        @Test
        @DisplayName("no extension in filename → INVALID_FILE_FORMAT")
        void validateImage_NoExtension_ThrowsInvalidFormat() {
            when(systemConfigurationService.getConfiguration()).thenReturn(mockConfig);

            byte[] tinyPng = buildMinimalPng();
            MockMultipartFile file = new MockMultipartFile("file", "imageWithNoExtension", "image/png", tinyPng);

            AppException ex = assertThrows(AppException.class,
                    () -> imageValidator.validateImage(file));
            assertEquals(ErrorCode.INVALID_FILE_FORMAT, ex.getErrorCode());
        }

        @Test
        @DisplayName("extension not in allowed list (.gif) → INVALID_FILE_FORMAT")
        void validateImage_ExtensionNotAllowed_ThrowsInvalidFormat() {
            when(systemConfigurationService.getConfiguration()).thenReturn(mockConfig);

            byte[] gifBytes = {0x47, 0x49, 0x46, 0x38, 0x39, 0x61}; // GIF89a magic bytes
            MockMultipartFile file = new MockMultipartFile("file", "anim.gif", "image/gif", gifBytes);

            AppException ex = assertThrows(AppException.class,
                    () -> imageValidator.validateImage(file));
            assertEquals(ErrorCode.INVALID_FILE_FORMAT, ex.getErrorCode());
        }

        @Test
        @DisplayName("extension is uppercase (.PNG) → treated as png (lower-case compare) → success")
        void validateImage_UpperCaseExtension_Success() {
            when(systemConfigurationService.getConfiguration()).thenReturn(mockConfig);

            byte[] tinyPng = buildMinimalPng();
            // ImageValidator calls .toLowerCase() so this should pass
            MockMultipartFile file = new MockMultipartFile("file", "photo.PNG", "image/png", tinyPng);

            assertDoesNotThrow(() -> imageValidator.validateImage(file));
        }

        @Test
        @DisplayName("empty allowed extensions list → INVALID_FILE_FORMAT")
        void validateImage_EmptyAllowedExtensions_ThrowsInvalidFormat() {
            SystemConfigurationResponse noExtConfig = SystemConfigurationResponse.builder()
                    .maxImageFileSizeMb(5)
                    .allowedImageExtensions(Collections.emptyList())
                    .build();
            when(systemConfigurationService.getConfiguration()).thenReturn(noExtConfig);

            byte[] tinyPng = buildMinimalPng();
            MockMultipartFile file = new MockMultipartFile("file", "photo.png", "image/png", tinyPng);

            AppException ex = assertThrows(AppException.class,
                    () -> imageValidator.validateImage(file));
            assertEquals(ErrorCode.INVALID_FILE_FORMAT, ex.getErrorCode());
        }

        @Test
        @DisplayName("null allowed extensions list → INVALID_FILE_FORMAT")
        void validateImage_NullAllowedExtensions_ThrowsInvalidFormat() {
            SystemConfigurationResponse nullExtConfig = SystemConfigurationResponse.builder()
                    .maxImageFileSizeMb(5)
                    .allowedImageExtensions(null)
                    .build();
            when(systemConfigurationService.getConfiguration()).thenReturn(nullExtConfig);

            byte[] tinyPng = buildMinimalPng();
            MockMultipartFile file = new MockMultipartFile("file", "photo.png", "image/png", tinyPng);

            AppException ex = assertThrows(AppException.class,
                    () -> imageValidator.validateImage(file));
            assertEquals(ErrorCode.INVALID_FILE_FORMAT, ex.getErrorCode());
        }
    }

    // ============================================================
    // File-size edge cases
    // ============================================================

    @Nested
    @DisplayName("File size validation")
    class FileSizeTests {

        @Test
        @DisplayName("file exactly at limit (5 MB) → success")
        void validateImage_ExactSizeAtLimit_Success() {
            when(systemConfigurationService.getConfiguration()).thenReturn(mockConfig);

            // Build a valid PNG header then pad to exactly 5 MB
            byte[] exactly5Mb = buildPngWithSize(5 * 1024 * 1024);
            MockMultipartFile file = new MockMultipartFile("file", "big.png", "image/png", exactly5Mb);

            assertDoesNotThrow(() -> imageValidator.validateImage(file));
        }

        @Test
        @DisplayName("file 1 byte over limit (5 MB + 1) → FILE_SIZE_EXCEEDS_LIMIT")
        void validateImage_OneBytOverLimit_ThrowsSizeExceeded() {
            when(systemConfigurationService.getConfiguration()).thenReturn(mockConfig);

            byte[] overLimit = buildPngWithSize(5 * 1024 * 1024 + 1);
            MockMultipartFile file = new MockMultipartFile("file", "toobig.png", "image/png", overLimit);

            AppException ex = assertThrows(AppException.class,
                    () -> imageValidator.validateImage(file));
            assertEquals(ErrorCode.FILE_SIZE_EXCEEDS_LIMIT, ex.getErrorCode());
        }
    }

    // ============================================================
    // Magic-bytes (Tika) anti-spoofing tests
    // ============================================================

    @Nested
    @DisplayName("Magic bytes (Tika) content-type enforcement")
    class MagicBytesTests {

        @Test
        @DisplayName("executable disguised as PNG (.png extension, EXE magic bytes) → INVALID_FILE_FORMAT")
        void validateImage_ExeDisguisedAsPng_ThrowsInvalidFormat() {
            when(systemConfigurationService.getConfiguration()).thenReturn(mockConfig);

            // Windows PE / MZ header – Tika detects as application/x-msdownload
            byte[] exeBytes = {0x4D, 0x5A, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00};
            MockMultipartFile file = new MockMultipartFile("file", "malware.png", "image/png", exeBytes);

            AppException ex = assertThrows(AppException.class,
                    () -> imageValidator.validateImage(file));
            assertEquals(ErrorCode.INVALID_FILE_FORMAT, ex.getErrorCode());
        }

        @Test
        @DisplayName("PDF disguised as JPEG (.jpeg extension, PDF magic bytes) → INVALID_FILE_FORMAT")
        void validateImage_PdfDisguisedAsJpeg_ThrowsInvalidFormat() {
            when(systemConfigurationService.getConfiguration()).thenReturn(mockConfig);

            // PDF magic: %PDF
            byte[] pdfBytes = {0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34};
            MockMultipartFile file = new MockMultipartFile("file", "invoice.jpeg", "image/jpeg", pdfBytes);

            AppException ex = assertThrows(AppException.class,
                    () -> imageValidator.validateImage(file));
            assertEquals(ErrorCode.INVALID_FILE_FORMAT, ex.getErrorCode());
        }

        @Test
        @DisplayName("valid JPEG (real magic bytes, .jpg extension) → success")
        void validateImage_ValidJpeg_Success() {
            when(systemConfigurationService.getConfiguration()).thenReturn(mockConfig);

            // JPEG magic: FF D8 FF
            byte[] jpegBytes = new byte[128];
            jpegBytes[0] = (byte) 0xFF;
            jpegBytes[1] = (byte) 0xD8;
            jpegBytes[2] = (byte) 0xFF;
            jpegBytes[3] = (byte) 0xE0;

            MockMultipartFile file = new MockMultipartFile("file", "photo.jpg", "image/jpeg", jpegBytes);
            assertDoesNotThrow(() -> imageValidator.validateImage(file));
        }

        @Test
        @DisplayName("valid WebP (real magic bytes, .webp extension) → success")
        void validateImage_ValidWebP_Success() {
            when(systemConfigurationService.getConfiguration()).thenReturn(mockConfig);

            // WebP: RIFF....WEBP
            byte[] webpBytes = new byte[32];
            webpBytes[0] = 0x52; // R
            webpBytes[1] = 0x49; // I
            webpBytes[2] = 0x46; // F
            webpBytes[3] = 0x46; // F
            webpBytes[4] = 0x1C; webpBytes[5] = 0x00; webpBytes[6] = 0x00; webpBytes[7] = 0x00;
            webpBytes[8]  = 0x57; // W
            webpBytes[9]  = 0x45; // E
            webpBytes[10] = 0x42; // B
            webpBytes[11] = 0x50; // P

            MockMultipartFile file = new MockMultipartFile("file", "image.webp", "image/webp", webpBytes);
            assertDoesNotThrow(() -> imageValidator.validateImage(file));
        }

        @Test
        @DisplayName("ZIP file disguised as PNG → INVALID_FILE_FORMAT")
        void validateImage_ZipDisguisedAsPng_ThrowsInvalidFormat() {
            when(systemConfigurationService.getConfiguration()).thenReturn(mockConfig);

            // ZIP magic: PK (50 4B 03 04)
            byte[] zipBytes = {0x50, 0x4B, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00};
            MockMultipartFile file = new MockMultipartFile("file", "archive.png", "image/png", zipBytes);

            AppException ex = assertThrows(AppException.class,
                    () -> imageValidator.validateImage(file));
            assertEquals(ErrorCode.INVALID_FILE_FORMAT, ex.getErrorCode());
        }
    }

    // ============================================================
    // Helpers
    // ============================================================

    /** Builds a valid 8-byte PNG signature (minimal parseable by Tika). */
    private byte[] buildMinimalPng() {
        return new byte[]{
                (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
                0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52
        };
    }

    /** Builds a byte array of the given size starting with a valid PNG signature. */
    private byte[] buildPngWithSize(int size) {
        byte[] data = new byte[size];
        byte[] header = buildMinimalPng();
        System.arraycopy(header, 0, data, 0, Math.min(header.length, size));
        return data;
    }
}
