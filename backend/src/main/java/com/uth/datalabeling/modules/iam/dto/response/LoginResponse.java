package com.uth.datalabeling.modules.iam.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LoginResponse {
  // Truy cập token dùng để xác thực cho các request sau
  String accessToken;

  // Loại token, mặc định là Bearer
  String tokenType;

  // Thời gian hết hạn của token (giây)
  long expiresIn;

  // Thông tin cơ bản của người dùng để Frontend hiển thị lên giao diện
  UserResponse user;
}
