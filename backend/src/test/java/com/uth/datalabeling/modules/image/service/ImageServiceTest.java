package com.uth.datalabeling.modules.image.service;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import com.uth.datalabeling.modules.iam.entity.User;
import com.uth.datalabeling.modules.iam.repository.UserRepository;
import com.uth.datalabeling.modules.image.dto.response.ImageUploadResponse;
import com.uth.datalabeling.modules.image.entity.FileMetadata;
import com.uth.datalabeling.modules.image.repository.FileMetadataRepository;
import com.uth.datalabeling.modules.image.strategy.ImageStorageStrategy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ImageServiceTest {

    @Mock
    private ImageValidator imageValidator;

    @Mock
    private FileMetadataRepository fileMetadataRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ImageStorageStrategy localStrategy;

    @Mock
    private ImageStorageStrategy cloudinaryStrategy;

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    private ImageService imageService;

    private User mockUser;

    @BeforeEach
    void setUp() {
        List<ImageStorageStrategy> strategies = Arrays.asList(localStrategy, cloudinaryStrategy);
        imageService = new ImageService(imageValidator, fileMetadataRepository, userRepository, strategies);

        mockUser = User.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .build();

        SecurityContextHolder.setContext(securityContext);
    }

    @Test
    void uploadImages_MultipleFiles_Success() {
        // Arrange
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("test@example.com");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(mockUser));

        when(localStrategy.isPrimary()).thenReturn(true);

        MockMultipartFile file1 = new MockMultipartFile("files", "img1.png", "image/png", "content1".getBytes());
        MockMultipartFile file2 = new MockMultipartFile("files", "img2.jpg", "image/jpeg", "content2".getBytes());
        List<MultipartFile> files = Arrays.asList(file1, file2);

        Map<String, Object> result1 = new HashMap<>();
        result1.put("filePath", "path/img1.png");
        result1.put("format", "image/png");
        result1.put("sizeBytes", 100L);

        Map<String, Object> result2 = new HashMap<>();
        result2.put("filePath", "path/img2.jpg");
        result2.put("format", "image/jpeg");
        result2.put("sizeBytes", 200L);

        when(localStrategy.upload(file1)).thenReturn(result1);
        when(localStrategy.upload(file2)).thenReturn(result2);

        when(fileMetadataRepository.save(any(FileMetadata.class))).thenAnswer(invocation -> {
            FileMetadata fm = invocation.getArgument(0);
            fm.setId(UUID.randomUUID());
            return fm;
        });

        // Act
        List<ImageUploadResponse> responses = imageService.uploadImages(files);

        // Assert
        assertEquals(2, responses.size());
        assertEquals("img1.png", responses.get(0).getFileName());
        assertEquals("img2.jpg", responses.get(1).getFileName());
        verify(imageValidator, times(2)).validateImage(any());
        verify(fileMetadataRepository, times(2)).save(any());
    }

    @Test
    void uploadImages_OneFileFailsValidation_ThrowsException() {
        // Arrange
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("test@example.com");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(mockUser));

        when(localStrategy.isPrimary()).thenReturn(true);

        MockMultipartFile file1 = new MockMultipartFile("files", "img1.png", "image/png", "content1".getBytes());
        MockMultipartFile file2 = new MockMultipartFile("files", "img2.txt", "text/plain", "content2".getBytes());
        List<MultipartFile> files = Arrays.asList(file1, file2);

        doNothing().when(imageValidator).validateImage(file1);
        doThrow(new AppException(ErrorCode.INVALID_FILE_FORMAT)).when(imageValidator).validateImage(file2);

        Map<String, Object> result1 = new HashMap<>();
        result1.put("filePath", "path/img1.png");
        result1.put("format", "image/png");
        result1.put("sizeBytes", 100L);
        when(localStrategy.upload(file1)).thenReturn(result1);

        when(fileMetadataRepository.save(any(FileMetadata.class))).thenAnswer(invocation -> {
            FileMetadata fm = invocation.getArgument(0);
            fm.setId(UUID.randomUUID());
            return fm;
        });

        // Act & Assert
        assertThrows(AppException.class, () -> imageService.uploadImages(files));

        // Ensure first file was validated but if we were using a real DB, transaction
        // would roll back.
        // In unit test, we just check that the exception is propagated.
        verify(localStrategy, times(0)).upload(file2);
    }

    @Test
    void uploadImages_EmptyList_ThrowsException() {
        assertThrows(AppException.class, () -> imageService.uploadImages(Collections.emptyList()));
    }

    @Test
    void uploadImages_Unauthenticated_ThrowsException() {
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(false);

        AppException exception = assertThrows(AppException.class,
                () -> imageService.uploadImages(Collections.singletonList(mockFile())));
        assertEquals(ErrorCode.UNAUTHORIZED, exception.getErrorCode());
    }

    @Test
    void uploadImages_UserNotFound_ThrowsException() {
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("missing@example.com");
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        AppException exception = assertThrows(AppException.class,
                () -> imageService.uploadImages(Collections.singletonList(mockFile())));
        assertEquals(ErrorCode.USER_NOT_FOUND, exception.getErrorCode());
    }

    @Test
    void uploadImages_NoPrimaryStrategy_ThrowsException() {
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("test@example.com");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(mockUser));

        when(localStrategy.isPrimary()).thenReturn(false);
        when(cloudinaryStrategy.isPrimary()).thenReturn(false);

        AppException exception = assertThrows(AppException.class,
                () -> imageService.uploadImages(Collections.singletonList(mockFile())));
        assertEquals(ErrorCode.INTERNAL_SERVER_ERROR, exception.getErrorCode());
    }

    private MockMultipartFile mockFile() {
        return new MockMultipartFile("files", "img1.png", "image/png", "content1".getBytes());
    }
}
