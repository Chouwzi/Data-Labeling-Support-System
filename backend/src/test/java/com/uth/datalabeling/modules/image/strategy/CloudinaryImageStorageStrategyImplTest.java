package com.uth.datalabeling.modules.image.strategy;

import com.cloudinary.Cloudinary;
import com.cloudinary.Uploader;
import com.cloudinary.utils.ObjectUtils;
import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CloudinaryImageStorageStrategyImplTest {

    @Mock
    private Cloudinary cloudinary;

    @Mock
    private Uploader uploader;

    @InjectMocks
    private CloudinaryImageStorageStrategyImpl cloudinaryImageStorageStrategy;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(cloudinaryImageStorageStrategy, "activeStrategy", "cloudinary");
    }

    @Test
    void testUploadSuccess() throws IOException {
        // Arrange
        MultipartFile file = new MockMultipartFile("file", "test.png", "image/png", "test content".getBytes());
        
        Map<String, Object> mockResult = new HashMap<>();
        mockResult.put("secure_url", "https://res.cloudinary.com/test/image/upload/test.png");
        mockResult.put("format", "png");
        mockResult.put("bytes", 1024);

        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.upload(any(byte[].class), anyMap())).thenReturn(mockResult);

        // Act
        Map<String, Object> result = cloudinaryImageStorageStrategy.upload(file);

        // Assert
        assertNotNull(result);
        assertEquals("https://res.cloudinary.com/test/image/upload/test.png", result.get("filePath"));
        assertEquals("image/png", result.get("format"));
        assertEquals(1024L, result.get("sizeBytes"));
    }

    @Test
    void testUploadFailure_ThrowsAppException() throws IOException {
        // Arrange
        MultipartFile file = new MockMultipartFile("file", "test.png", "image/png", "test content".getBytes());
        
        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.upload(any(byte[].class), anyMap())).thenThrow(new IOException("Upload failed"));

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () -> {
            cloudinaryImageStorageStrategy.upload(file);
        });

        assertEquals(ErrorCode.UPLOAD_FAILED, exception.getErrorCode());
    }

    @Test
    void testIsPrimary_True() {
        ReflectionTestUtils.setField(cloudinaryImageStorageStrategy, "activeStrategy", "cloudinary");
        assertTrue(cloudinaryImageStorageStrategy.isPrimary());
    }

    @Test
    void testIsPrimary_False() {
        ReflectionTestUtils.setField(cloudinaryImageStorageStrategy, "activeStrategy", "local");
        assertFalse(cloudinaryImageStorageStrategy.isPrimary());
    }
}
