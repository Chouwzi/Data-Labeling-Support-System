package com.uth.datalabeling.common.storage;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class LocalFileSystemStorageServiceTest {

    @InjectMocks
    private LocalFileSystemStorageService storageService;

    @TempDir
    Path tempDir;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(storageService, "baseUploadDir", tempDir.toString());
    }

    @Test
    void store_Success() {
        MockMultipartFile mockFile = new MockMultipartFile(
                "file", "test.txt", "text/plain", "Hello World".getBytes()
        );

        String resultPath = storageService.store(mockFile, "projects");

        assertNotNull(resultPath);
        assertTrue(resultPath.contains("test.txt"));
        assertTrue(Files.exists(Path.of(resultPath)));
    }

    @Test
    void store_NullOriginalFilename_ThrowsException() {
        MockMultipartFile mockFile = new MockMultipartFile(
                "file", "", "text/plain", "Hello World".getBytes()
        );

        AppException exception = assertThrows(AppException.class, () -> {
            storageService.store(mockFile, "projects");
        });

        assertEquals(ErrorCode.VALIDATION_ERROR, exception.getErrorCode());
        assertTrue(exception.getMessage().contains("không hợp lệ"));
    }

    @Test
    void store_PathTraversal_ThrowsException() {
        MockMultipartFile mockFile = new MockMultipartFile(
                "file", "../test.txt", "text/plain", "Hello World".getBytes()
        );

        AppException exception = assertThrows(AppException.class, () -> {
            storageService.store(mockFile, "projects");
        });

        assertEquals(ErrorCode.VALIDATION_ERROR, exception.getErrorCode());
        assertTrue(exception.getMessage().contains("không hợp lệ"));
    }

    @Test
    void store_NullByteInjection_ThrowsException() {
        MockMultipartFile mockFile = new MockMultipartFile(
                "file", "test\0.txt", "text/plain", "Hello World".getBytes()
        );

        AppException exception = assertThrows(AppException.class, () -> {
            storageService.store(mockFile, "projects");
        });

        assertEquals(ErrorCode.VALIDATION_ERROR, exception.getErrorCode());
        assertTrue(exception.getMessage().contains("không hợp lệ"));
    }
}
