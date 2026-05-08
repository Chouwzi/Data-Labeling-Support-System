package com.uth.datalabeling.modules.image.strategy;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class LocalImageStorageStrategyImplTest {

    @TempDir
    Path tempDir;

    @Test
    void upload_SavesFileAndReturnsMetadata() throws Exception {
        LocalImageStorageStrategyImpl strategy = new LocalImageStorageStrategyImpl();
        ReflectionTestUtils.setField(strategy, "uploadDir", tempDir.toString());
        ReflectionTestUtils.setField(strategy, "activeStrategy", "local");

        MockMultipartFile file = new MockMultipartFile(
                "file", "test.png", "image/png", "image-content".getBytes());

        Map<String, Object> result = strategy.upload(file);

        assertNotNull(result.get("filePath"));
        assertEquals("image/png", result.get("format"));
        assertEquals((long) "image-content".getBytes().length, result.get("sizeBytes"));

        Path savedPath = Path.of(result.get("filePath").toString());
        assertTrue(Files.exists(savedPath));
    }

    @Test
    void upload_PathTraversal_ThrowsException() {
        LocalImageStorageStrategyImpl strategy = new LocalImageStorageStrategyImpl();
        ReflectionTestUtils.setField(strategy, "uploadDir", tempDir.toString());

        MockMultipartFile file = new MockMultipartFile(
                "file", "../evil.png", "image/png", "image-content".getBytes());

        AppException exception = assertThrows(AppException.class, () -> strategy.upload(file));
        assertEquals(ErrorCode.INVALID_FILE_FORMAT, exception.getErrorCode());
    }

    @Test
    void isPrimary_UsesActiveStrategy() {
        LocalImageStorageStrategyImpl strategy = new LocalImageStorageStrategyImpl();
        ReflectionTestUtils.setField(strategy, "activeStrategy", "local");
        assertTrue(strategy.isPrimary());

        ReflectionTestUtils.setField(strategy, "activeStrategy", "cloudinary");
        assertTrue(!strategy.isPrimary());
    }
}
