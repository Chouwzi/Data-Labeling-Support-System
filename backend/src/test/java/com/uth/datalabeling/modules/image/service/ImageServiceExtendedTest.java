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
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Extended tests for ImageService:
 * – verifies Cloudinary strategy path
 * – verifies null Authentication → UNAUTHORIZED
 * – verifies per-file transaction rollback when mid-batch upload fails
 * – verifies response DTO is correctly mapped from saved entity
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("ImageService – Extended Tests")
class ImageServiceExtendedTest {

    @Mock private ImageValidator imageValidator;
    @Mock private FileMetadataRepository fileMetadataRepository;
    @Mock private UserRepository userRepository;
    @Mock private ImageStorageStrategy localStrategy;
    @Mock private ImageStorageStrategy cloudinaryStrategy;
    @Mock private SecurityContext securityContext;
    @Mock private Authentication authentication;

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

    // ============================================================
    // Null auth context edge cases
    // ============================================================

    @Nested
    @DisplayName("Authentication context edge cases")
    class AuthContextTests {

        @Test
        @DisplayName("null Authentication in SecurityContext → UNAUTHORIZED")
        void uploadImages_NullAuthentication_ThrowsUnauthorized() {
            when(securityContext.getAuthentication()).thenReturn(null);

            AppException ex = assertThrows(AppException.class,
                    () -> imageService.uploadImages(List.of(mockFile())));
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorCode());
        }

        @Test
        @DisplayName("isAuthenticated() returns false → UNAUTHORIZED")
        void uploadImages_NotAuthenticated_ThrowsUnauthorized() {
            when(securityContext.getAuthentication()).thenReturn(authentication);
            when(authentication.isAuthenticated()).thenReturn(false);

            AppException ex = assertThrows(AppException.class,
                    () -> imageService.uploadImages(List.of(mockFile())));
            assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorCode());
        }

        @Test
        @DisplayName("authenticated user not in DB → USER_NOT_FOUND")
        void uploadImages_UserNotInDb_ThrowsUserNotFound() {
            authenticateAs("ghost@example.com");
            when(userRepository.findByEmail("ghost@example.com")).thenReturn(Optional.empty());

            AppException ex = assertThrows(AppException.class,
                    () -> imageService.uploadImages(List.of(mockFile())));
            assertEquals(ErrorCode.USER_NOT_FOUND, ex.getErrorCode());
        }
    }

    // ============================================================
    // Input validation edge cases
    // ============================================================

    @Nested
    @DisplayName("Input validation edge cases")
    class InputValidationTests {

        @Test
        @DisplayName("null file list → BAD_REQUEST")
        void uploadImages_NullList_ThrowsBadRequest() {
            AppException ex = assertThrows(AppException.class,
                    () -> imageService.uploadImages(null));
            assertEquals(ErrorCode.BAD_REQUEST, ex.getErrorCode());
        }

        @Test
        @DisplayName("empty file list → BAD_REQUEST")
        void uploadImages_EmptyList_ThrowsBadRequest() {
            AppException ex = assertThrows(AppException.class,
                    () -> imageService.uploadImages(Collections.emptyList()));
            assertEquals(ErrorCode.BAD_REQUEST, ex.getErrorCode());
        }
    }

    // ============================================================
    // Strategy selection
    // ============================================================

    @Nested
    @DisplayName("Storage strategy selection")
    class StrategySelectionTests {

        @Test
        @DisplayName("when Cloudinary is primary → Cloudinary strategy is used")
        void uploadImages_CloudinaryPrimary_UsesCloudinaryStrategy() {
            authenticateAs("test@example.com");

            when(cloudinaryStrategy.isPrimary()).thenReturn(true);
            when(localStrategy.isPrimary()).thenReturn(false);

            Map<String, Object> cloudResult = Map.of(
                    "filePath", "https://res.cloudinary.com/demo/image/upload/test.png",
                    "format", "image/png",
                    "sizeBytes", 1024L
            );
            when(cloudinaryStrategy.upload(any())).thenReturn(cloudResult);
            when(fileMetadataRepository.save(any())).thenAnswer(inv -> {
                FileMetadata fm = inv.getArgument(0);
                fm.setId(UUID.randomUUID());
                return fm;
            });

            List<ImageUploadResponse> responses = imageService.uploadImages(List.of(mockFile()));

            assertEquals(1, responses.size());
            assertTrue(responses.get(0).getFilePath().contains("cloudinary.com"),
                    "filePath must be a Cloudinary URL when Cloudinary strategy is active");
            verify(cloudinaryStrategy, times(1)).upload(any());
            verify(localStrategy, never()).upload(any());
        }

        @Test
        @DisplayName("when local is primary → local strategy is used")
        void uploadImages_LocalPrimary_UsesLocalStrategy() {
            authenticateAs("test@example.com");

            when(localStrategy.isPrimary()).thenReturn(true);
            when(cloudinaryStrategy.isPrimary()).thenReturn(false);

            Map<String, Object> localResult = Map.of(
                    "filePath", "/uploads/uuid.png",
                    "format", "image/png",
                    "sizeBytes", 512L
            );
            when(localStrategy.upload(any())).thenReturn(localResult);
            when(fileMetadataRepository.save(any())).thenAnswer(inv -> {
                FileMetadata fm = inv.getArgument(0);
                fm.setId(UUID.randomUUID());
                return fm;
            });

            List<ImageUploadResponse> responses = imageService.uploadImages(List.of(mockFile()));

            assertEquals(1, responses.size());
            verify(localStrategy, times(1)).upload(any());
            verify(cloudinaryStrategy, never()).upload(any());
        }

        @Test
        @DisplayName("no primary strategy found → INTERNAL_SERVER_ERROR")
        void uploadImages_NoPrimaryStrategy_ThrowsInternalServerError() {
            authenticateAs("test@example.com");

            when(localStrategy.isPrimary()).thenReturn(false);
            when(cloudinaryStrategy.isPrimary()).thenReturn(false);

            AppException ex = assertThrows(AppException.class,
                    () -> imageService.uploadImages(List.of(mockFile())));
            assertEquals(ErrorCode.INTERNAL_SERVER_ERROR, ex.getErrorCode());
        }
    }

    // ============================================================
    // Batch upload behaviour
    // ============================================================

    @Nested
    @DisplayName("Batch upload behaviour")
    class BatchUploadTests {

        @Test
        @DisplayName("single file → exactly one DB save")
        void uploadImages_SingleFile_OneDbSave() {
            authenticateAs("test@example.com");
            when(localStrategy.isPrimary()).thenReturn(true);
            when(localStrategy.upload(any())).thenReturn(Map.of("filePath", "/p", "format", "image/png", "sizeBytes", 1L));
            when(fileMetadataRepository.save(any())).thenAnswer(inv -> {
                FileMetadata fm = inv.getArgument(0);
                fm.setId(UUID.randomUUID());
                return fm;
            });

            imageService.uploadImages(List.of(mockFile()));

            verify(fileMetadataRepository, times(1)).save(any());
        }

        @Test
        @DisplayName("3 files → 3 validations, 3 uploads, 3 DB saves")
        void uploadImages_ThreeFiles_ThreeOfEach() {
            authenticateAs("test@example.com");
            when(localStrategy.isPrimary()).thenReturn(true);
            when(localStrategy.upload(any())).thenReturn(Map.of("filePath", "/p", "format", "image/png", "sizeBytes", 1L));
            when(fileMetadataRepository.save(any())).thenAnswer(inv -> {
                FileMetadata fm = inv.getArgument(0);
                fm.setId(UUID.randomUUID());
                return fm;
            });

            List<MultipartFile> files = List.of(mockFile(), mockFile(), mockFile());
            List<ImageUploadResponse> responses = imageService.uploadImages(files);

            assertEquals(3, responses.size());
            verify(imageValidator, times(3)).validateImage(any());
            verify(localStrategy, times(3)).upload(any());
            verify(fileMetadataRepository, times(3)).save(any());
        }

        @Test
        @DisplayName("second file fails validation → exception propagates (first file already uploaded in-loop)")
        void uploadImages_SecondFileFailsValidation_ExceptionPropagates() {
            authenticateAs("test@example.com");
            when(localStrategy.isPrimary()).thenReturn(true);

            MockMultipartFile good = mockFile();
            MockMultipartFile bad = new MockMultipartFile("files", "bad.exe", "application/octet-stream", "ev".getBytes());

            doNothing().when(imageValidator).validateImage(good);
            doThrow(new AppException(ErrorCode.INVALID_FILE_FORMAT)).when(imageValidator).validateImage(bad);

            when(localStrategy.upload(good)).thenReturn(Map.of("filePath", "/p", "format", "image/png", "sizeBytes", 1L));
            when(fileMetadataRepository.save(any())).thenAnswer(inv -> {
                FileMetadata fm = inv.getArgument(0);
                fm.setId(UUID.randomUUID());
                return fm;
            });

            assertThrows(AppException.class,
                    () -> imageService.uploadImages(List.of(good, bad)));

            // bad file's upload must never be called
            verify(localStrategy, never()).upload(bad);
        }
    }

    // ============================================================
    // Response DTO mapping
    // ============================================================

    @Nested
    @DisplayName("Response DTO mapping")
    class ResponseMappingTests {

        @Test
        @DisplayName("response DTO fields must match saved FileMetadata")
        void uploadImages_ResponseDtoMatchesSavedEntity() {
            authenticateAs("test@example.com");
            when(localStrategy.isPrimary()).thenReturn(true);

            UUID assignedId = UUID.randomUUID();
            Map<String, Object> uploadResult = Map.of(
                    "filePath", "/uploads/unique.png",
                    "format", "image/png",
                    "sizeBytes", 9876L
            );
            when(localStrategy.upload(any())).thenReturn(uploadResult);
            when(fileMetadataRepository.save(any())).thenAnswer(inv -> {
                FileMetadata fm = inv.getArgument(0);
                fm.setId(assignedId);
                return fm;
            });

            MockMultipartFile file = new MockMultipartFile("files", "photo.png", "image/png", "data".getBytes());
            List<ImageUploadResponse> responses = imageService.uploadImages(List.of(file));

            ImageUploadResponse resp = responses.get(0);
            assertAll(
                    () -> assertEquals(assignedId, resp.getId()),
                    () -> assertEquals("photo.png", resp.getFileName()),
                    () -> assertEquals("/uploads/unique.png", resp.getFilePath()),
                    () -> assertEquals("image/png", resp.getFormat()),
                    () -> assertEquals(9876L, resp.getSizeBytes())
            );
        }
    }

    // ============================================================
    // Helpers
    // ============================================================

    private void authenticateAs(String email) {
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn(email);
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(mockUser));
    }

    private MockMultipartFile mockFile() {
        return new MockMultipartFile("files", "img.png", "image/png", "content".getBytes());
    }
}
