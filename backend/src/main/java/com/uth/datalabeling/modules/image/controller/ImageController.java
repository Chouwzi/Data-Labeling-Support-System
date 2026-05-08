package com.uth.datalabeling.modules.image.controller;

import com.uth.datalabeling.common.response.ApiResponse;
import com.uth.datalabeling.modules.image.dto.response.ImageUploadResponse;
import com.uth.datalabeling.modules.image.service.ImageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequestMapping("/images")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Tag(name = "Images", description = "Quản lý hình ảnh")
public class ImageController {

    ImageService imageService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Tải lên nhiều hình ảnh", description = "Hỗ trợ tải lên nhiều file ảnh với định dạng được cấu hình trong hệ thống")
    public ResponseEntity<ApiResponse<List<ImageUploadResponse>>> uploadImages(
            @RequestPart("files") List<MultipartFile> files) {
        
        List<ImageUploadResponse> responses = imageService.uploadImages(files);

        ApiResponse<List<ImageUploadResponse>> apiResponse = ApiResponse.<List<ImageUploadResponse>>builder()
                .code(2000)
                .message("Tải ảnh lên thành công")
                .result(responses)
                .build();

        return ResponseEntity.status(HttpStatus.OK).body(apiResponse);
    }
}
