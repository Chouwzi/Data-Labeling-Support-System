package com.uth.datalabeling.modules.image.service;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import com.uth.datalabeling.modules.systemconfig.dto.response.SystemConfigurationResponse;
import com.uth.datalabeling.modules.systemconfig.service.SystemConfigurationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class ImageValidatorTest {

    @Mock
    private SystemConfigurationService systemConfigurationService;

    @InjectMocks
    private ImageValidator imageValidator;

    private SystemConfigurationResponse mockConfig;

    @BeforeEach
    void setUp() {
        mockConfig = SystemConfigurationResponse.builder()
                .maxImageFileSizeMb(5)
                .allowedImageExtensions(Arrays.asList("jpg", "png", "jpeg"))
                .build();
    }

    @Test
    void validateImage_Success() {
        when(systemConfigurationService.getConfiguration()).thenReturn(mockConfig);
        
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.png", "image/png", new byte[1024]);
        
        // Should not throw any exception
        imageValidator.validateImage(file);
    }

    @Test
    void validateImage_EmptyFile_ThrowsBadRequest() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.png", "image/png", new byte[0]);
        
        AppException exception = assertThrows(AppException.class, () -> {
            imageValidator.validateImage(file);
        });
        assertEquals(ErrorCode.BAD_REQUEST, exception.getErrorCode());
    }

    @Test
    void validateImage_SizeExceedsLimit_ThrowsException() {
        when(systemConfigurationService.getConfiguration()).thenReturn(mockConfig);
        
        // 6MB file
        byte[] largeContent = new byte[6 * 1024 * 1024];
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.png", "image/png", largeContent);
        
        AppException exception = assertThrows(AppException.class, () -> {
            imageValidator.validateImage(file);
        });
        assertEquals(ErrorCode.FILE_SIZE_EXCEEDS_LIMIT, exception.getErrorCode());
    }

    @Test
    void validateImage_InvalidExtension_ThrowsException() {
        when(systemConfigurationService.getConfiguration()).thenReturn(mockConfig);
        
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.gif", "image/gif", new byte[1024]);
        
        AppException exception = assertThrows(AppException.class, () -> {
            imageValidator.validateImage(file);
        });
        assertEquals(ErrorCode.INVALID_FILE_FORMAT, exception.getErrorCode());
    }

    @Test
    void validateImage_InvalidContentType_ThrowsException() {
        when(systemConfigurationService.getConfiguration()).thenReturn(mockConfig);
        
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.png", "application/pdf", new byte[1024]);
        
        AppException exception = assertThrows(AppException.class, () -> {
            imageValidator.validateImage(file);
        });
        assertEquals(ErrorCode.INVALID_FILE_FORMAT, exception.getErrorCode());
    }
}
