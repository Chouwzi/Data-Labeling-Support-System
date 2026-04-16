package com.uth.datalabeling.common.exception;

import lombok.Getter;

/**
 * Ngoại lệ tùy chỉnh cho các lỗi nghiệp vụ.
 */
@Getter
public class AppException extends RuntimeException {
  private final ErrorCode errorCode;

  public AppException(ErrorCode errorCode) {
    super(errorCode.getMessage());
    this.errorCode = errorCode;
  }

  // Khởi tạo lỗi với thông báo chi tiết tùy chỉnh
  public AppException(ErrorCode errorCode, String message) {
    super(message);
    this.errorCode = errorCode;
  }
}
