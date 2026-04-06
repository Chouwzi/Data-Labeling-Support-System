package com.uth.datalabeling.modules.iam.controller;

import com.uth.datalabeling.common.response.ApiResponse;
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
@PreAuthorize("hasRole('ADMIN')")
public class UserController {
  UserService userService;

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<UserResponse> createUser(@Valid @RequestBody UserCreationRequest request) {
    return ApiResponse.<UserResponse>builder()
        .result(userService.createUser(request))
        .build();
  }

  @GetMapping
  public ApiResponse<List<UserResponse>> getAllUsers() {
    return ApiResponse.<List<UserResponse>>builder()
        .result(userService.getAllUsers())
        .build();
  }

  @GetMapping("/{userId}")
  public ApiResponse<UserResponse> getUser(@PathVariable("userId") UUID userId) {
    return ApiResponse.<UserResponse>builder()
        .result(userService.getUserById(userId))
        .build();
  }

  @PutMapping("/{userId}")
  public ApiResponse<UserResponse> updateUser(@PathVariable("userId") UUID userId,
      @Valid @RequestBody UserUpdateRequest request) {
    return ApiResponse.<UserResponse>builder()
        .result(userService.updateUser(userId, request))
        .build();
  }

  @DeleteMapping("/{userId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public ApiResponse<Void> deleteUser(@PathVariable("userId") UUID userId) {
    userService.deleteUser(userId);
    return ApiResponse.<Void>builder()
        .message("User has been deleted")
        .build();
  }
}