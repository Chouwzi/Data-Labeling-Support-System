package com.uth.datalabeling.modules.iam.service;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import com.uth.datalabeling.modules.iam.dto.request.UserGroupRequest;
import com.uth.datalabeling.modules.iam.dto.response.UserGroupResponse;
import com.uth.datalabeling.modules.iam.dto.response.UserResponse;
import com.uth.datalabeling.modules.iam.entity.User;
import com.uth.datalabeling.modules.iam.entity.UserGroup;
import com.uth.datalabeling.modules.iam.mapper.UserMapper;
import com.uth.datalabeling.modules.iam.repository.UserGroupRepository;
import com.uth.datalabeling.modules.iam.repository.UserRepository;
import com.uth.datalabeling.modules.project.service.ProjectAccessService;
import java.util.List;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserGroupService {
  UserGroupRepository groupRepository;
  UserRepository userRepository;
  UserMapper userMapper;
  ProjectAccessService projectAccessService;

  @Transactional(readOnly = true)
  public List<UserGroupResponse> getGroups() {
    User currentUser = projectAccessService.getCurrentUser();
    List<UserGroup> groups = projectAccessService.isAdmin(currentUser)
        ? groupRepository.findAll()
        : groupRepository.findAllByManagerId(currentUser.getId());
    return groups.stream().map(this::toResponse).toList();
  }

  @Transactional(readOnly = true)
  public List<UserResponse> getMembers(UUID groupId) {
    UserGroup group = findGroupForCurrentUser(groupId);
    return userRepository.findAllByGroupId(group.getId()).stream()
        .map(userMapper::toUserResponse)
        .toList();
  }

  @Transactional
  public UserGroupResponse createGroup(UserGroupRequest request) {
    User currentUser = projectAccessService.getCurrentUser();
    if (!projectAccessService.isAdmin(currentUser)) {
      throw new AppException(ErrorCode.FORBIDDEN);
    }
    if (groupRepository.existsByNameIgnoreCase(request.getName().trim())) {
      throw new AppException(ErrorCode.CONFLICT, "Tên group đã tồn tại");
    }

    User manager = resolveManager(request.getManagerId());
    UserGroup group = UserGroup.builder()
        .name(request.getName().trim())
        .description(normalizeDescription(request.getDescription()))
        .manager(manager)
        .build();
    return toResponse(groupRepository.save(group));
  }

  @Transactional
  public UserGroupResponse updateGroup(UUID groupId, UserGroupRequest request) {
    UserGroup group = findGroupForCurrentUser(groupId);
    if (groupRepository.existsByNameIgnoreCaseAndIdNot(request.getName().trim(), groupId)) {
      throw new AppException(ErrorCode.CONFLICT, "Tên group đã tồn tại");
    }
    group.setName(request.getName().trim());
    group.setDescription(normalizeDescription(request.getDescription()));
    if (projectAccessService.isAdmin(projectAccessService.getCurrentUser())) {
      group.setManager(resolveManager(request.getManagerId()));
    }
    return toResponse(groupRepository.save(group));
  }

  @Transactional
  public void deleteGroup(UUID groupId) {
    User currentUser = projectAccessService.getCurrentUser();
    if (!projectAccessService.isAdmin(currentUser)) {
      throw new AppException(ErrorCode.FORBIDDEN);
    }
    UserGroup group = groupRepository.findById(groupId)
        .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Group not found"));
    userRepository.findAllByGroupId(groupId).forEach(user -> user.setGroup(null));
    groupRepository.delete(group);
  }

  private UserGroup findGroupForCurrentUser(UUID groupId) {
    User currentUser = projectAccessService.getCurrentUser();
    if (projectAccessService.isAdmin(currentUser)) {
      return groupRepository.findById(groupId)
          .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Group not found"));
    }
    return groupRepository.findByIdAndManagerId(groupId, currentUser.getId())
        .orElseThrow(() -> new AppException(ErrorCode.FORBIDDEN));
  }

  private User resolveManager(UUID managerId) {
    if (managerId == null) {
      return null;
    }
    User manager = userRepository.findById(managerId)
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    if (!"MANAGER".equals(manager.getRole())) {
      throw new AppException(ErrorCode.VALIDATION_ERROR, "Group manager must have MANAGER role");
    }
    return manager;
  }

  private UserGroupResponse toResponse(UserGroup group) {
    User manager = group.getManager();
    return UserGroupResponse.builder()
        .id(group.getId())
        .name(group.getName())
        .description(group.getDescription())
        .managerId(manager != null ? manager.getId() : null)
        .managerName(manager != null ? manager.getFullName() : null)
        .memberCount(userRepository.countByGroupId(group.getId()))
        .build();
  }

  private String normalizeDescription(String description) {
    return description == null || description.isBlank() ? null : description.trim();
  }
}
