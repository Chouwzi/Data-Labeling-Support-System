package com.uth.datalabeling.security.jwt;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

  // Dùng request attribute để chuyển mã lỗi JWT sang AuthenticationEntryPoint.
  public static final String JWT_ERROR_CODE_ATTR = "jwt_error_code";

  private final JwtTokenProvider tokenProvider;
  private final UserDetailsService userDetailsService;

  public JwtAuthenticationFilter(JwtTokenProvider tokenProvider, UserDetailsService userDetailsService) {
    this.tokenProvider = tokenProvider;
    this.userDetailsService = userDetailsService;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
      FilterChain filterChain) throws ServletException, IOException {
    try {
      // Lấy token từ header Authorization
      String token = resolveToken(request);

      // Kiểm tra xem token có hợp lệ không
      if (StringUtils.hasText(token) && tokenProvider.validateToken(token)) {
        // Lấy email từ token
        String email = tokenProvider.getEmailFromToken(token);

        // Nạp thông tin người dùng từ database
        var userDetails = userDetailsService.loadUserByUsername(email);

        // Tạo đối tượng định danh (Authentication) cho Spring Security
        var authentication = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

        // Lưu thông tin xác thực vào Context để dùng ở các bước sau
        SecurityContextHolder.getContext().setAuthentication(authentication);
      }
    } catch (AppException ex) {
      // Lưu mã lỗi business để response 401 trả đúng TOKEN_EXPIRED/TOKEN_INVALID.
      request.setAttribute(JWT_ERROR_CODE_ATTR, ex.getErrorCode());
      SecurityContextHolder.clearContext();
      // Ném AuthenticationException để Spring Security xử lý qua entry point
      throw new BadCredentialsException(ex.getMessage(), ex);
    } catch (UsernameNotFoundException ex) {
      // Token hợp lệ nhưng user không còn tồn tại/lỗi -> coi là token không hợp lệ
      request.setAttribute(JWT_ERROR_CODE_ATTR, ErrorCode.TOKEN_INVALID);
      SecurityContextHolder.clearContext();
      throw new BadCredentialsException("Token không hợp lệ", ex);
    }

    // Chuyển tiếp request sang các filter tiếp theo
    filterChain.doFilter(request, response);
  }

  // Hàm lọc lấy token, bỏ "Bearer " ở đầu
  private String resolveToken(HttpServletRequest request) {
    String bearerToken = request.getHeader("Authorization");
    if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
      return bearerToken.substring(7);
    }
    return null;
  }
}
