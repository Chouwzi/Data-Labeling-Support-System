package com.uth.datalabeling.modules.image.strategy;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Extended tests for LocalImageStorageStrategyImpl:
 * – correct UUID-based unique filenames
 * – metadata field is NOT present (null) in result  
 * – multiple files get distinct paths
 * – various path-traversal patterns
 * – isPrimary case-insensitivity
 */
@DisplayName("LocalImageStorageStrategyImpl – Extended Tests")
class LocalStorageStrategyExtendedTest {

    @TempDir
    Path tempDir;

    // ============================================================
    // Upload correctness
    // ============================================================

    @Nested
    @DisplayName("Upload behaviour")
    class UploadBehaviourTests {

        @Test
        @DisplayName("result must contain filePath, format, sizeBytes")
        void upload_ResultContainsRequiredKeys() {
            LocalImageStorageStrategyImpl strategy = createStrategy();
            MockMultipartFile file = new MockMultipartFile("file", "photo.png", "image/png", "img-data".getBytes());

            Map<String, Object> result = strategy.upload(file);

            assertAll(
                    () -> assertNotNull(result.get("filePath"), "filePath must be present"),
                    () -> assertEquals("image/png", result.get("format")),
                    () -> assertEquals((long) "img-data".getBytes().length, result.get("sizeBytes"))
            );
        }

        @Test
        @DisplayName("uploaded file actually exists on disk at the returned filePath")
        void upload_FileExistsOnDisk() throws Exception {
            LocalImageStorageStrategyImpl strategy = createStrategy();
            MockMultipartFile file = new MockMultipartFile("file", "photo.png", "image/png", "content".getBytes());

            Map<String, Object> result = strategy.upload(file);

            Path saved = Path.of((String) result.get("filePath"));
            assertTrue(Files.exists(saved), "File must physically exist after upload");
            assertArrayEquals("content".getBytes(), Files.readAllBytes(saved));
        }

        @Test
        @DisplayName("two uploads of same filename → distinct file paths (UUID-based)")
        void upload_TwoFilesWithSameName_GetDistinctPaths() {
            LocalImageStorageStrategyImpl strategy = createStrategy();
            MockMultipartFile f1 = new MockMultipartFile("file", "same.png", "image/png", "data1".getBytes());
            MockMultipartFile f2 = new MockMultipartFile("file", "same.png", "image/png", "data2".getBytes());

            String path1 = (String) strategy.upload(f1).get("filePath");
            String path2 = (String) strategy.upload(f2).get("filePath");

            assertNotEquals(path1, path2, "Each upload must produce a unique file path");
        }

        @Test
        @DisplayName("metadata key is NOT present in result (local strategy does not set it)")
        void upload_MetadataKeyAbsent_InLocalResult() {
            LocalImageStorageStrategyImpl strategy = createStrategy();
            MockMultipartFile file = new MockMultipartFile("file", "photo.png", "image/png", "data".getBytes());

            Map<String, Object> result = strategy.upload(file);

            // Local strategy does not set metadata – key must be absent (or null)
            assertFalse(result.containsKey("metadata") && result.get("metadata") != null,
                    "Local strategy should not populate a 'metadata' key");
        }

        @Test
        @DisplayName("file with no extension → stored with no suffix but still saves correctly")
        void upload_NoExtension_StillSaves() throws Exception {
            LocalImageStorageStrategyImpl strategy = createStrategy();
            MockMultipartFile file = new MockMultipartFile("file", "image_no_ext", "image/png", "data".getBytes());

            Map<String, Object> result = strategy.upload(file);
            Path saved = Path.of((String) result.get("filePath"));
            assertTrue(Files.exists(saved));
        }
    }

    // ============================================================
    // Path-traversal protection
    // ============================================================

    @Nested
    @DisplayName("Path traversal protection")
    class PathTraversalTests {

        @Test
        @DisplayName("'../evil.png' → INVALID_FILE_FORMAT")
        void upload_DotDotSlash_ThrowsInvalidFormat() {
            LocalImageStorageStrategyImpl strategy = createStrategy();
            MockMultipartFile file = new MockMultipartFile("file", "../evil.png", "image/png", "bad".getBytes());

            AppException ex = assertThrows(AppException.class, () -> strategy.upload(file));
            assertEquals(ErrorCode.INVALID_FILE_FORMAT, ex.getErrorCode());
        }

        @Test
        @DisplayName("'../../etc/passwd' → INVALID_FILE_FORMAT")
        void upload_DeepTraversal_ThrowsInvalidFormat() {
            LocalImageStorageStrategyImpl strategy = createStrategy();
            MockMultipartFile file = new MockMultipartFile("file", "../../etc/passwd", "image/png", "bad".getBytes());

            AppException ex = assertThrows(AppException.class, () -> strategy.upload(file));
            assertEquals(ErrorCode.INVALID_FILE_FORMAT, ex.getErrorCode());
        }
    }

    // ============================================================
    // isPrimary()
    // ============================================================

    @Nested
    @DisplayName("isPrimary() strategy detection")
    class IsPrimaryTests {

        @Test
        @DisplayName("'local' → true")
        void isPrimary_Local_True() {
            LocalImageStorageStrategyImpl strategy = createStrategy();
            ReflectionTestUtils.setField(strategy, "activeStrategy", "local");
            assertTrue(strategy.isPrimary());
        }

        @Test
        @DisplayName("'LOCAL' (uppercase) → true (case-insensitive)")
        void isPrimary_LocalUppercase_True() {
            LocalImageStorageStrategyImpl strategy = createStrategy();
            ReflectionTestUtils.setField(strategy, "activeStrategy", "LOCAL");
            assertTrue(strategy.isPrimary());
        }

        @Test
        @DisplayName("'cloudinary' → false")
        void isPrimary_Cloudinary_False() {
            LocalImageStorageStrategyImpl strategy = createStrategy();
            ReflectionTestUtils.setField(strategy, "activeStrategy", "cloudinary");
            assertFalse(strategy.isPrimary());
        }

        @Test
        @DisplayName("'' (empty string) → false")
        void isPrimary_Empty_False() {
            LocalImageStorageStrategyImpl strategy = createStrategy();
            ReflectionTestUtils.setField(strategy, "activeStrategy", "");
            assertFalse(strategy.isPrimary());
        }
    }

    // ============================================================
    // Helper
    // ============================================================

    private LocalImageStorageStrategyImpl createStrategy() {
        LocalImageStorageStrategyImpl strategy = new LocalImageStorageStrategyImpl();
        ReflectionTestUtils.setField(strategy, "uploadDir", tempDir.toString());
        ReflectionTestUtils.setField(strategy, "activeStrategy", "local");
        return strategy;
    }
}
