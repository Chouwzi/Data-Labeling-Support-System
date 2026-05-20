package com.uth.datalabeling.modules.iam.controller;

import com.uth.datalabeling.common.response.ApiResponse;
import com.uth.datalabeling.modules.activitylog.annotation.LogActivity;
import com.uth.datalabeling.modules.iam.dto.request.UserCreationRequest;
import com.uth.datalabeling.modules.iam.dto.request.UserUpdateRequest;
import com.uth.datalabeling.modules.iam.dto.response.UserResponse;
import com.uth.datalabeling.modules.iam.service.UserService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserController {
  UserService userService;

  /**
   * Tạo mới một người dùng.
   */
  @PostMapping
  @PreAuthorize("hasRole('ADMIN')")
  @ResponseStatus(HttpStatus.CREATED)
  @LogActivity(action = "CREATE_USER", entityType = "USER")
  public ApiResponse<UserResponse> createUser(@Valid @RequestBody UserCreationRequest request) {
    return ApiResponse.<UserResponse>builder()
        .result(userService.createUser(request))
        .build();
  }

  /**
   * Lấy danh sách tất cả người dùng.
   */
  @GetMapping
  @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
  @LogActivity(action = "VIEW_ALL_USERS")
  public ApiResponse<List<UserResponse>> getAllUsers() {
    return ApiResponse.<List<UserResponse>>builder()
        .result(userService.getAllUsers())
        .build();
  }

  /**
   * Lấy danh sách những người gắn nhãn (Annotators).
   */
  @GetMapping("/annotators")
  @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
  public ApiResponse<List<UserResponse>> getAnnotators() {
    return ApiResponse.<List<UserResponse>>builder()
        .result(userService.getUsersByRole("ANNOTATOR"))
        .build();
  }

  /**
   * Lấy thông tin chi tiết một người dùng theo ID.
   */
  @GetMapping("/{userId}")
  @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
  @LogActivity(action = "VIEW_USER")
  public ApiResponse<UserResponse> getUser(@PathVariable("userId") UUID userId) {
    return ApiResponse.<UserResponse>builder()
        .result(userService.getUserById(userId))
        .build();
  }

  /**
   * Cập nhật thông tin người dùng.
   */
  @PutMapping("/{userId}")
  @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
  @LogActivity(action = "UPDATE_USER", entityType = "USER", entityIdParam = "userId")
  public ApiResponse<UserResponse> updateUser(@PathVariable("userId") UUID userId,
      @Valid @RequestBody UserUpdateRequest request) {
    return ApiResponse.<UserResponse>builder()
        .result(userService.updateUser(userId, request))
        .build();
  }

  /**
   * Xóa một người dùng.
   */
  @DeleteMapping("/{userId}")
  @PreAuthorize("hasRole('ADMIN')")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @LogActivity(action = "DELETE_USER", entityType = "USER", entityIdParam = "userId")
  public ApiResponse<Void> deleteUser(@PathVariable("userId") UUID userId) {
    userService.deleteUser(userId);
    return ApiResponse.<Void>builder()
        .message("Người dùng đã được xóa thành công.")
        .build();
  }
}
