package com.uth.datalabeling.modules.iam.controller;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import com.uth.datalabeling.common.response.ApiResponse;
import com.uth.datalabeling.config.security.JwtTokenProvider;
import com.uth.datalabeling.modules.iam.dto.request.LoginRequest;
import com.uth.datalabeling.modules.iam.dto.response.LoginResponse;
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

  @PostMapping("/login")
  @ResponseStatus(HttpStatus.OK)
  public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
    try {
      Authentication authentication = authenticationManager.authenticate(
          new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
      String token = jwtTokenProvider.generateToken(authentication);

      return ApiResponse.<LoginResponse>builder()
          .result(new LoginResponse(token, "Bearer"))
          .build();
    } catch (AuthenticationException ex) {
      throw new AppException(ErrorCode.INVALID_CREDENTIALS);
    }
  }
}
