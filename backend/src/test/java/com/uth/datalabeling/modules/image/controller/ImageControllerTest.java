package com.uth.datalabeling.modules.image.controller;

import com.uth.datalabeling.modules.image.dto.response.ImageUploadResponse;
import com.uth.datalabeling.modules.image.service.ImageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
public class ImageControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ImageService imageService;

    @InjectMocks
    private ImageController imageController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(imageController).build();
    }

    @Test
    void uploadImages_Success() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "files", "test.png", "image/png", "test image content".getBytes());

        ImageUploadResponse response = ImageUploadResponse.builder()
                .id(UUID.randomUUID())
                .fileName("test.png")
                .filePath("uploads/test-uuid.png")
                .format("image/png")
                .sizeBytes((long) "test image content".getBytes().length)
                .build();

        when(imageService.uploadImages(any())).thenReturn(Collections.singletonList(response));

        mockMvc.perform(multipart("/api/v1/images/upload")
                .file(file)
                .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(2000))
                .andExpect(jsonPath("$.message").value("Tải ảnh lên thành công"))
                .andExpect(jsonPath("$.result[0].fileName").value("test.png"))
                .andExpect(jsonPath("$.result[0].format").value("image/png"));
    }
}
