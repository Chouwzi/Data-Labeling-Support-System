package com.uth.datalabeling.modules.image.controller;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/uploads")
public class UploadFileController {

    private static final MediaType IMAGE_SVG = MediaType.valueOf("image/svg+xml");

    private final Path uploadRoot;

    public UploadFileController(@Value("${app.upload.dir:uploads/}") String uploadDir) {
        this.uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    @GetMapping("/{filename:.+}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'ANNOTATOR', 'REVIEWER')")
    public ResponseEntity<?> getUpload(@PathVariable String filename) throws IOException {
        Path filePath = uploadRoot.resolve(filename).normalize();
        if (!filePath.startsWith(uploadRoot)) {
            throw new AppException(ErrorCode.NOT_FOUND, "Không tìm thấy file ảnh");
        }
        if (!Files.exists(filePath) || !Files.isRegularFile(filePath)) {
            return ResponseEntity.ok()
                    .contentType(IMAGE_SVG)
                    .body(missingImagePlaceholder(filename));
        }

        Resource resource = new UrlResource(filePath.toUri());
        String contentType = Files.probeContentType(filePath);
        if (contentType == null || !contentType.startsWith("image/")) {
            contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CACHE_CONTROL, "private, max-age=300")
                .body(resource);
    }

    private byte[] missingImagePlaceholder(String filename) {
        String safeName = filename == null ? "missing image" : filename.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
        String svg = """
                <svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
                  <rect width="320" height="320" fill="#f3f4f6"/>
                  <rect x="82" y="96" width="156" height="112" rx="12" fill="none" stroke="#9ca3af" stroke-width="8"/>
                  <circle cx="126" cy="132" r="14" fill="#9ca3af"/>
                  <path d="M96 192l48-48 34 34 22-22 34 36" fill="none" stroke="#9ca3af" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
                  <text x="160" y="242" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" fill="#6b7280">Missing local file</text>
                  <text x="160" y="264" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#9ca3af">%s</text>
                </svg>
                """.formatted(safeName);
        return svg.getBytes(StandardCharsets.UTF_8);
    }
}
