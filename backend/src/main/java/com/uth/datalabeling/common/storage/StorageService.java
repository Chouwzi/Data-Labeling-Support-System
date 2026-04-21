package com.uth.datalabeling.common.storage;

import org.springframework.web.multipart.MultipartFile;

/**
 * Interface cho dịch vụ lưu trữ file, tuân thủ nguyên lý Dependency Inversion (SOLID).
 * Dễ dàng mở rộng sau này (ví dụ S3StorageService, GcpStorageService) mà không sửa business logic.
 */
public interface StorageService {
    
    /**
     * Lưu trữ một file vào thư mục/môi trường lưu trữ.
     * 
     * @param file File cần lưu
     * @param folder Thư mục con (ví dụ: "projects", "datasets")
     * @return Đường dẫn hoặc URL của file đã lưu
     */
    String store(MultipartFile file, String folder);
}
