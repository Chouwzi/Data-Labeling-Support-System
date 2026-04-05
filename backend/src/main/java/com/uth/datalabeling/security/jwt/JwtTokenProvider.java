package com.uth.datalabeling.security.jwt;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component
public class JwtTokenProvider {

  @Value("${jwt.secret}") // Lấy key jwt từ properties/.env
  private String jwtSecret;

  @Value("${jwt.expiration}") // Thời hạn jwt (seconds)
  private long jwtExpiration;

  @Value("${jwt.issuer}")
  private String jwtIssuer;

  private Key signingKey;

  @PostConstruct
  public void init() {
    if (jwtSecret == null || jwtSecret.getBytes(StandardCharsets.UTF_8).length < 32) {
      throw new IllegalStateException("JWT secret must be at least 32 bytes for HS256");
    }
    signingKey = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
  }

  // Tạo token từ thông tin đăng nhập thành công
  public String generateToken(Authentication authentication) {
    String email = authentication.getName();

    Date now = new Date();
    // Chuyển đổi giây sang milis giây để dùng với thư viện Date của Java
    Date expiryDate = new Date(now.getTime() + jwtExpiration * 1000);

    return Jwts.builder()
        .setSubject(email)
        .setIssuer(jwtIssuer)
        .setIssuedAt(now)
        .setExpiration(expiryDate)
        .signWith(signingKey, SignatureAlgorithm.HS256)
        .compact();
  }

  // Đọc email của người dùng từ token
  public String getEmailFromToken(String token) {
    return Jwts.parserBuilder()
        .setSigningKey(signingKey)
        .requireIssuer(jwtIssuer)
        .build()
        .parseClaimsJws(token)
        .getBody()
        .getSubject();
  }

  // Kiểm tra xem token có bị hết hạn, sai hoặc bị sửa đổi
  public boolean validateToken(String token) {
    try {
      Jwts.parserBuilder()
          .setSigningKey(signingKey)
          .requireIssuer(jwtIssuer)
          .build()
          .parseClaimsJws(token);
      return true;
    } catch (ExpiredJwtException ex) {
      // Token hết hạn
      throw new AppException(ErrorCode.TOKEN_EXPIRED);
    } catch (JwtException | IllegalArgumentException ex) {
      // Token sai định dạng hoặc giả mạo
      throw new AppException(ErrorCode.TOKEN_INVALID);
    }
  }

  // Cung cấp thời hạn của token cho LoginResponse (seconds)
  public long getExpiration() {
    return jwtExpiration;
  }
}
