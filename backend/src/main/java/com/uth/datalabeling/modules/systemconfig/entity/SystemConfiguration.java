package com.uth.datalabeling.modules.systemconfig.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "system_configuration")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SystemConfiguration {
  @Id
  Integer id; // ID mặc định (Luôn là 1 cho Singleton)

  @Column(name = "max_image_file_size_mb", nullable = false)
  Integer maxImageFileSizeMb;

  @Column(name = "ai_labeling_enabled", nullable = false)
  boolean aiLabelingEnabled; // Bật/Tắt hỗ trợ gắn nhãn AI

  @Column(name = "default_page_size", nullable = false)
  Integer defaultPageSize; // Số

  @Column(name = "allowed_image_extensions", nullable = false, length = 500)
  String allowedImageExtensions; // Lưu dưới dạng chuỗi phân cách bởi dấu phẩy

  @CreationTimestamp
  @Column(name = "created_at", updatable = false)
  LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at")
  LocalDateTime updatedAt;

  @Column(name = "updated_by")
  String updatedBy;

  @Version
  @Column(nullable = false)
  @Builder.Default
  Long version = 0L;
}
