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

import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {
  ObjectMapper objectMapper;

  @Override
  public void commence(HttpServletRequest request, HttpServletResponse response,
      AuthenticationException authException) throws IOException, ServletException {
    // Mặc định cho trường hợp chưa đăng nhập/thiếu token.
    ErrorCode errorCode = ErrorCode.UNAUTHORIZED;

    // Nếu filter trước đó đã xác định lỗi JWT cụ thể thì trả đúng mã nghiệp vụ
    Object jwtError = request.getAttribute(JwtAuthenticationFilter.JWT_ERROR_CODE_ATTR);
    if (jwtError instanceof ErrorCode ec) {
      errorCode = ec;
    }

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
