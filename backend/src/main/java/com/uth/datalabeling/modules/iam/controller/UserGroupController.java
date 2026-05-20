package com.uth.datalabeling.modules.iam.controller;

import com.uth.datalabeling.common.response.ApiResponse;
import com.uth.datalabeling.modules.iam.dto.request.UserGroupRequest;
import com.uth.datalabeling.modules.iam.dto.response.UserGroupResponse;
import com.uth.datalabeling.modules.iam.dto.response.UserResponse;
import com.uth.datalabeling.modules.iam.service.UserGroupService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/groups")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserGroupController {
  UserGroupService userGroupService;

  @GetMapping
  @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
  public ApiResponse<List<UserGroupResponse>> getGroups() {
    return ApiResponse.<List<UserGroupResponse>>builder()
        .result(userGroupService.getGroups())
        .build();
  }

  @GetMapping("/{groupId}/members")
  @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
  public ApiResponse<List<UserResponse>> getMembers(@PathVariable UUID groupId) {
    return ApiResponse.<List<UserResponse>>builder()
        .result(userGroupService.getMembers(groupId))
        .build();
  }

  @PostMapping
  @PreAuthorize("hasRole('ADMIN')")
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<UserGroupResponse> createGroup(@RequestBody @Valid UserGroupRequest request) {
    return ApiResponse.<UserGroupResponse>builder()
        .code(HttpStatus.CREATED.value())
        .result(userGroupService.createGroup(request))
        .build();
  }

  @PutMapping("/{groupId}")
  @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
  public ApiResponse<UserGroupResponse> updateGroup(
      @PathVariable UUID groupId,
      @RequestBody @Valid UserGroupRequest request) {
    return ApiResponse.<UserGroupResponse>builder()
        .result(userGroupService.updateGroup(groupId, request))
        .build();
  }

  @DeleteMapping("/{groupId}")
  @PreAuthorize("hasRole('ADMIN')")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public ApiResponse<Void> deleteGroup(@PathVariable UUID groupId) {
    userGroupService.deleteGroup(groupId);
    return ApiResponse.<Void>builder().build();
  }
}
