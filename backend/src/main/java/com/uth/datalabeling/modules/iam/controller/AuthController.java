package com.uth.datalabeling.modules.iam.controller;

import com.uth.datalabeling.activitylog.annotation.LogActivity;
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
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthController {

  AuthenticationManager authenticationManager;
  JwtTokenProvider jwtTokenProvider;
  UserRepository userRepository;
  UserMapper userMapper;

  
  @LogActivity(action = "LOGIN")
  @PostMapping("/login")
  @ResponseStatus(HttpStatus.OK)
  public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
    try {
      Authentication authentication = authenticationManager.authenticate(
          new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

      String token = jwtTokenProvider.generateToken(authentication);

      User user = userRepository.findByEmail(request.getEmail())
          .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

      LoginResponse loginResponse = LoginResponse.builder()
          .accessToken(token)
          .tokenType("Bearer")
          .expiresIn(jwtTokenProvider.getExpiration())
          .user(userMapper.toUserResponse(user))
          .build();

      return ApiResponse.<LoginResponse>builder()
          .result(loginResponse)
          .build();

    } catch (AuthenticationException ex) {
      throw new AppException(ErrorCode.INVALID_CREDENTIALS);
    }
  }
}