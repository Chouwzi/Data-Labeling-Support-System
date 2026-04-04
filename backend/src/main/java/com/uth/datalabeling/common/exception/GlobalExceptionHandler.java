package com.uth.datalabeling.common.exception;

import com.uth.datalabeling.common.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(value = AppException.class)
  public ResponseEntity<ApiResponse<Object>> handleAppException(AppException ex) {
    ErrorCode errorCode = ex.getErrorCode();
    ApiResponse<Object> response = ApiResponse.builder()
        .code(errorCode.getCode())
        .message(errorCode.getMessage())
        .build();
    return ResponseEntity.status(errorCode.getHttpStatus()).body(response);
  }

  @ExceptionHandler(value = MethodArgumentNotValidException.class)
  public ResponseEntity<ApiResponse<Object>> handleValidationException(MethodArgumentNotValidException exception) {
    String messageKey = exception.getFieldError().getDefaultMessage();
    // Mặc định errorCode sẽ là VALIDATION_ERROR
    // Để đề phòng trường hợp ghi sai enumKey ở các message validation
    ErrorCode errorCode = ErrorCode.VALIDATION_ERROR;

    try {
      errorCode = ErrorCode.valueOf(messageKey);
    } catch (IllegalArgumentException e) {
      System.out.println("\nInvalid Key: " + e);
    }

    ApiResponse<Object> apiResponse = ApiResponse.builder()
        .code(errorCode.getCode())
        .message(errorCode.getMessage())
        .build();
    return ResponseEntity.status(errorCode.getHttpStatus()).body(apiResponse);
  }

  @ExceptionHandler(value = Exception.class)
  public ResponseEntity<ApiResponse<Object>> handleGeneralException(Exception exception) {
    ErrorCode errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
    ApiResponse<Object> response = ApiResponse.builder()
        .code(errorCode.getCode())
        .message(errorCode.getMessage())
        .build();
    return ResponseEntity.status(errorCode.getHttpStatus()).body(response);
  }
}
