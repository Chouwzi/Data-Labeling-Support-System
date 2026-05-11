package com.uth.datalabeling.modules.iam.service;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import com.uth.datalabeling.modules.iam.dto.request.UserCreationRequest;
import com.uth.datalabeling.modules.iam.dto.request.UserUpdateRequest;
import com.uth.datalabeling.modules.iam.dto.response.UserResponse;
import com.uth.datalabeling.modules.iam.entity.User;
import com.uth.datalabeling.modules.iam.mapper.UserMapper;
import com.uth.datalabeling.modules.iam.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserService {
  UserRepository userRepository;
  UserMapper userMapper;
  PasswordEncoder passwordEncoder;

  /**
   * Tạo người dùng mới.
   */
  public UserResponse createUser(UserCreationRequest request) {
    if (userRepository.existsByEmail(request.getEmail())) {
      throw new AppException(ErrorCode.USER_ALREADY_EXISTS);
    }

    User user = userMapper.toUser(request);

    // Mã hóa mật khẩu bằng BCrypt
    user.setPassword(passwordEncoder.encode(user.getPassword()));
    return userMapper.toUserResponse(userRepository.save(user));
  }

  /**
   * Lấy tất cả người dùng.
   */
  public List<UserResponse> getAllUsers() {
    return userRepository.findAll().stream()
        .map(userMapper::toUserResponse)
        .toList();
  }

  /**
   * Lấy danh sách người dùng theo vai trò (Role).
   */
  public List<UserResponse> getUsersByRole(String role) {
    return userRepository.findAllByRole(role).stream()
        .map(userMapper::toUserResponse)
        .toList();
  }

  /**
   * Lấy người dùng theo ID.
   */
  public UserResponse getUserById(UUID id) {
    return userRepository.findById(id)
        .map(userMapper::toUserResponse)
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
  }

  /**
   * Cập nhật thông tin người dùng.
   */
  public UserResponse updateUser(UUID id, UserUpdateRequest request) {
    User user = userRepository.findById(id)
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

    // Lưu mật khẩu cũ đề phòng mapper ghi đè null
    String oldPassword = user.getPassword();

    userMapper.updateUser(user, request);

    // Chỉ mã hóa và cập nhật mật khẩu nếu request có mật khẩu mới
    if (request.getPassword() != null && !request.getPassword().isBlank()) {
      user.setPassword(passwordEncoder.encode(request.getPassword()));
    } else {
      user.setPassword(oldPassword);
    }

    return userMapper.toUserResponse(userRepository.save(user));
  }

  /**
   * Xóa người dùng theo ID.
   */
  public void deleteUser(UUID id) {
    if (!userRepository.existsById(id)) {
      throw new AppException(ErrorCode.USER_NOT_FOUND);
    }
    userRepository.deleteById(id);
  }
}
