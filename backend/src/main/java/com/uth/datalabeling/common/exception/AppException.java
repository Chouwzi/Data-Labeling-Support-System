package com.uth.datalabeling.common.exception;

import lombok.Getter;

@Getter
public class AppException extends RuntimeException {
  private final ErrorCode errorCode;

  public AppException(ErrorCode errorCode) {
    super(errorCode.getMessage());
    this.errorCode = errorCode;
  }
}
