package com.uth.datalabeling.security.jwt;

import com.uth.datalabeling.common.exception.ErrorCode;
import com.uth.datalabeling.common.response.ApiResponse;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class JwtAccessDeniedHandler implements AccessDeniedHandler {
  ObjectMapper objectMapper;

  @Override
  public void handle(HttpServletRequest request, HttpServletResponse response,
      AccessDeniedException accessDeniedException) throws IOException, ServletException {
    // Trường hợp đã xác thực nhưng không đủ quyền truy cập tài nguyên
    ErrorCode errorCode = ErrorCode.FORBIDDEN;

    response.setStatus(errorCode.getHttpStatus());
    response.setContentType("application/json");
    response.setCharacterEncoding("UTF-8");

    ApiResponse<Object> body = ApiResponse.builder()
        .code(errorCode.getCode())
        .message(errorCode.getMessage())
        .build();

    response.getWriter().write(objectMapper.writeValueAsString(body));
  }
}
