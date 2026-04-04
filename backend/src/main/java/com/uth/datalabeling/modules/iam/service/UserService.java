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
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserService {
  UserRepository userRepository;
  UserMapper userMapper;

  public UserResponse createUser(UserCreationRequest request) {
    if (userRepository.existsByEmail(request.getEmail())) {
      throw new AppException(ErrorCode.USER_ALREADY_EXISTS);
    }

    User user = userMapper.toUser(request);

    return userMapper.toUserResponse(userRepository.save(user));
  }

  public List<UserResponse> getAllUsers() {
    return userRepository.findAll().stream()
        .map(userMapper::toUserResponse)
        .toList();
  }

  public UserResponse getUserById(UUID id) {
    return userRepository.findById(id)
        .map(userMapper::toUserResponse)
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
  }

  public UserResponse updateUser(UUID id, UserUpdateRequest request) {
    User user = userRepository.findById(id)
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

    userMapper.updateUser(user, request);

    return userMapper.toUserResponse(userRepository.save(user));
  }

  public void deleteUser(UUID id) {
    if (!userRepository.existsById(id)) {
      throw new AppException(ErrorCode.USER_NOT_FOUND);
    }
    userRepository.deleteById(id);
  }
}
