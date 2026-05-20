package com.uth.datalabeling.modules.iam.service;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import com.uth.datalabeling.modules.iam.dto.request.UserCreationRequest;
import com.uth.datalabeling.modules.iam.dto.request.UserUpdateRequest;
import com.uth.datalabeling.modules.iam.dto.response.UserResponse;
import com.uth.datalabeling.modules.iam.entity.User;
import com.uth.datalabeling.modules.iam.entity.UserGroup;
import com.uth.datalabeling.modules.iam.mapper.UserMapper;
import com.uth.datalabeling.modules.iam.repository.UserGroupRepository;
import com.uth.datalabeling.modules.iam.repository.UserRepository;
import com.uth.datalabeling.modules.project.service.ProjectAccessService;
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
  UserGroupRepository userGroupRepository;
  UserMapper userMapper;
  PasswordEncoder passwordEncoder;
  ProjectAccessService projectAccessService;

  /**
   * Tạo người dùng mới.
   */
  public UserResponse createUser(UserCreationRequest request) {
    if (userRepository.existsByEmail(request.getEmail())) {
      throw new AppException(ErrorCode.USER_ALREADY_EXISTS);
    }

    User user = userMapper.toUser(request);
    user.setGroup(resolveGroupForWrite(request.getGroupId(), request.getRole()));

    // Mã hóa mật khẩu bằng BCrypt
    user.setPassword(passwordEncoder.encode(user.getPassword()));
    return userMapper.toUserResponse(userRepository.save(user));
  }

  /**
   * Lấy tất cả người dùng.
   */
  public List<UserResponse> getAllUsers() {
    if (projectAccessService == null) {
      return userRepository.findAll().stream()
          .map(userMapper::toUserResponse)
          .toList();
    }
    User currentUser = projectAccessService.getCurrentUser();
    List<User> users = projectAccessService.isAdmin(currentUser)
        ? userRepository.findAll()
        : currentUser.getGroup() == null
            ? List.of()
            : userRepository.findAllByGroupId(currentUser.getGroup().getId());

    return users.stream()
        .map(userMapper::toUserResponse)
        .toList();
  }

  /**
   * Lấy danh sách người dùng theo vai trò (Role).
   */
  public List<UserResponse> getUsersByRole(String role) {
    if (projectAccessService == null) {
      return userRepository.findAllByRole(role).stream()
          .map(userMapper::toUserResponse)
          .toList();
    }
    User currentUser = projectAccessService.getCurrentUser();
    List<User> users = projectAccessService.isAdmin(currentUser)
        ? userRepository.findAllByRole(role)
        : currentUser.getGroup() == null
            ? List.of()
            : userRepository.findAllByRoleAndGroupId(role, currentUser.getGroup().getId());

    return users.stream()
        .map(userMapper::toUserResponse)
        .toList();
  }

  /**
   * Lấy người dùng theo ID.
   */
  public UserResponse getUserById(UUID id) {
    User user = userRepository.findById(id)
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    if (projectAccessService == null) {
      return userMapper.toUserResponse(user);
    }
    User currentUser = projectAccessService.getCurrentUser();
    if (!projectAccessService.isAdmin(currentUser)) {
      UUID currentGroupId = currentUser.getGroup() != null ? currentUser.getGroup().getId() : null;
      UUID targetGroupId = user.getGroup() != null ? user.getGroup().getId() : null;
      if (currentGroupId == null || !currentGroupId.equals(targetGroupId)) {
        throw new AppException(ErrorCode.FORBIDDEN);
      }
    }
    return userMapper.toUserResponse(user);
  }

  /**
   * Cập nhật thông tin người dùng.
   */
  public UserResponse updateUser(UUID id, UserUpdateRequest request) {
    User user = userRepository.findById(id)
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

    // Lưu mật khẩu cũ đề phòng mapper ghi đè null
    String oldPassword = user.getPassword();
    enforceManagerCannotChangeOwnRole(user, request);
    enforceUserWriteScope(user, request.getRole());
    enforceManagerRoleOnlyUpdate(user, request);

    userMapper.updateUser(user, request);
    user.setGroup(resolveGroupForWrite(request.getGroupId(), request.getRole()));

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

  private UserGroup resolveGroupForWrite(UUID groupId, String role) {
    if (groupId == null) {
      return null;
    }
    User currentUser = projectAccessService.getCurrentUser();
    UserGroup group = userGroupRepository.findById(groupId)
        .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Group not found"));
    if (!projectAccessService.isAdmin(currentUser)) {
      if (currentUser.getGroup() == null || !groupId.equals(currentUser.getGroup().getId())) {
        throw new AppException(ErrorCode.FORBIDDEN);
      }
      if (!"ANNOTATOR".equals(role) && !"REVIEWER".equals(role)) {
        throw new AppException(ErrorCode.FORBIDDEN);
      }
    }
    return group;
  }

  private void enforceUserWriteScope(User target, String targetRole) {
    User currentUser = projectAccessService.getCurrentUser();
    if (projectAccessService.isAdmin(currentUser)) {
      return;
    }
    UUID currentGroupId = currentUser.getGroup() != null ? currentUser.getGroup().getId() : null;
    UUID targetGroupId = target.getGroup() != null ? target.getGroup().getId() : null;
    if (currentGroupId == null || !currentGroupId.equals(targetGroupId)) {
      throw new AppException(ErrorCode.FORBIDDEN);
    }
    if (!"ANNOTATOR".equals(targetRole) && !"REVIEWER".equals(targetRole)) {
      throw new AppException(ErrorCode.FORBIDDEN);
    }
  }

  private void enforceManagerCannotChangeOwnRole(User target, UserUpdateRequest request) {
    User currentUser = projectAccessService.getCurrentUser();
    if (projectAccessService.isAdmin(currentUser)) {
      return;
    }
    if (currentUser.getId() != null
        && currentUser.getId().equals(target.getId())
        && !java.util.Objects.equals(target.getRole(), request.getRole())) {
      throw new AppException(ErrorCode.FORBIDDEN);
    }
  }

  private void enforceManagerRoleOnlyUpdate(User target, UserUpdateRequest request) {
    User currentUser = projectAccessService.getCurrentUser();
    if (projectAccessService.isAdmin(currentUser)) {
      return;
    }
    UUID targetGroupId = target.getGroup() != null ? target.getGroup().getId() : null;
    if (!target.getEmail().equals(request.getEmail())
        || !target.getFullName().equals(request.getFullName())
        || (request.getActive() != null && target.isActive() != request.getActive())
        || !java.util.Objects.equals(targetGroupId, request.getGroupId())) {
      throw new AppException(ErrorCode.FORBIDDEN);
    }
  }
}
