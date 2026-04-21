package com.uth.datalabeling.common.storage;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class LocalFileSystemStorageService implements StorageService {

    @Value("${app.upload.dir}")
    private String baseUploadDir;

    @Override
    public String store(MultipartFile file, String folder) {
        try {
            // Tạo thư mục cụ thể cho module
            Path uploadPath = Paths.get(baseUploadDir, folder);

            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Lấy và kiểm tra tên file gốc (Chống Path Traversal & Null Byte)
            String originalFileName = file.getOriginalFilename();
            if (originalFileName == null || originalFileName.trim().isEmpty() || originalFileName.contains("..") || originalFileName.contains("\0")) {
                throw new AppException(ErrorCode.VALIDATION_ERROR, "Tên file không hợp lệ");
            }
            
            // Random hóa tên file để chống trùng lặp và ghi đè
            String fileName = UUID.randomUUID() + "_" + originalFileName;
            Path path = uploadPath.resolve(fileName).normalize();

            // Kiểm tra bảo mật lần cuối cho đường dẫn
            if (!path.startsWith(uploadPath)) {
                throw new AppException(ErrorCode.VALIDATION_ERROR, "Đường dẫn file không hợp lệ");
            }

            // Lưu file vào đĩa cứng
            Files.copy(file.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);

            return path.toString();
        } catch (IOException e) {
            throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, "Lỗi khi lưu file");
        }
    }
}
