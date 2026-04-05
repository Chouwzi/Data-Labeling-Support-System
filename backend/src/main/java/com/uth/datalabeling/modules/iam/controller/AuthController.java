package com.uth.datalabeling.modules.iam.controller;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import com.uth.datalabeling.common.response.ApiResponse;
import com.uth.datalabeling.modules.iam.dto.request.LoginRequest;
import com.uth.datalabeling.modules.iam.dto.response.LoginResponse;
import com.uth.datalabeling.modules.iam.entity.User;
import com.uth.datalabeling.modules.iam.mapper.UserMapper;
import com.uth.datalabeling.modules.iam.repository.UserRepository;
import com.uth.datalabeling.security.jwt.JwtTokenProvider;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthController {

  AuthenticationManager authenticationManager;
  JwtTokenProvider jwtTokenProvider;
  UserRepository userRepository;
  UserMapper userMapper;

  // Xử lý yêu cầu đăng nhập và trả về token cùng thông tin người dùng
  @PostMapping("/login")
  @ResponseStatus(HttpStatus.OK)
  public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
    try {
      // Xác thực người dùng bằng email và password
      Authentication authentication = authenticationManager.authenticate(
          new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

      // Nếu xác thực thành công, tạo JWT token cho phiên
      String token = jwtTokenProvider.generateToken(authentication);

      // Tìm thông tin chi tiết của User
      User user = userRepository.findByEmail(request.getEmail())
          .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

      LoginResponse loginResponse = LoginResponse.builder()
          .accessToken(token)
          .tokenType("Bearer")
          .expiresIn(jwtTokenProvider.getExpiration())  // Thời gian hết hạn của token (giây)
          .user(userMapper.toUserResponse(user)) // Đính kèm thông tin user
          .build();

      return ApiResponse.<LoginResponse>builder()
          .result(loginResponse)
          .build();
    } catch (AuthenticationException ex) {
      // Ném lỗi nếu sai thông tin đăng nhập
      throw new AppException(ErrorCode.INVALID_CREDENTIALS);
    }
  }
}
