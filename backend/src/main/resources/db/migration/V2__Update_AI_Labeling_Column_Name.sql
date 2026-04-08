-- Bảng cấu hình hệ thống (Dùng cơ chế Singleton - chỉ một bản ghi duy nhất)
CREATE TABLE IF NOT EXISTS system_configuration (
  id INTEGER PRIMARY KEY, -- ID mặc định luôn là 1
  max_image_file_size_mb INTEGER NOT NULL,
  ai_labeling_enabled BOOLEAN NOT NULL DEFAULT TRUE, -- Bật/Tắt hỗ trợ gắn nhãn bằng AI
  default_page_size INTEGER NOT NULL,
  allowed_image_extensions VARCHAR(500) NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(255),
  version BIGINT -- Version dùng cho khóa lạc quan (Optimistic Locking)
);

-- Khởi tạo cấu hình mặc định ban đầu
INSERT INTO system_configuration (
  id,
  max_image_file_size_mb,
  ai_labeling_enabled,
  default_page_size,
  allowed_image_extensions,
  updated_by
)
VALUES (1, 20, TRUE, 25, 'jpg,jpeg,png,webp', 'system')
ON CONFLICT (id) DO NOTHING;
