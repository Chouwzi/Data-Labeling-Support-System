package com.uth.datalabeling.modules.iam.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Entity // Khai báo cho Spring Boot biết đây là Enity
@Table(name = "users") // Đặt tên bảng là users trong db
@Data // Tự tạo Getter/Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE) // Mặc định các Field không có access type sẽ tự động là private
public class User {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  UUID id;

  @Column(nullable = false, unique = true) // Không được rỗng và phải là duy nhất
  @Email(message = "INVALID_CREDENTIALS")
  @NotBlank(message = "MISSING_REQUIRED_FIELD")
  String email;

  @Column(name = "full_name")
  String fullName;

  String password;

  @Builder.Default
  @Column(name = "is_active")
  boolean active = true;

  @Column(length = 50)
  String role;

  @CreationTimestamp
  @Column(name = "created_at", updatable = false)
  LocalDateTime createdAt;
}
