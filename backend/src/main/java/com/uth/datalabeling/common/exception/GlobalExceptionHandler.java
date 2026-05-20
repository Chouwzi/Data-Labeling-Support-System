package com.uth.datalabeling.common.exception;

import com.uth.datalabeling.common.response.ApiResponse;
import org.springframework.dao.InvalidDataAccessApiUsageException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.HttpMediaTypeNotSupportedException;
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

  // Ưu tiên bắt các ngoại lệ liên quan đến phân quyền của Spring Security
  // Nếu không có block này thì Exception catch-all sẽ báo lỗi 500 Server Error
  @ExceptionHandler(value = {
      org.springframework.security.access.AccessDeniedException.class,
      org.springframework.security.authorization.AuthorizationDeniedException.class
  })
  public void handleAccessDeniedException(Exception ex) throws Exception {
    // Throw ngược ra ngoài để Spring Security can thiệp
    // Và gọi JwtAccessDeniedHandler (trả về lỗi 403 Forbidden)
    throw ex;
  }

  @ExceptionHandler(value = MethodArgumentNotValidException.class)
  public ResponseEntity<ApiResponse<Object>> handleValidationException(MethodArgumentNotValidException exception) {
    String messageKey = exception.getFieldError().getDefaultMessage();
    String field = exception.getFieldError().getField();

    // Ghi log để biết field nào bị thiếu/lỗi validation ở môi trường test/dev
    System.out.println("\nValidation failed for field: " + field + ", messageKey: " + messageKey);

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

  @ExceptionHandler(value = InvalidDataAccessApiUsageException.class)
  public ResponseEntity<ApiResponse<Object>> handleInvalidDataAccessApiUsageException(
      InvalidDataAccessApiUsageException exception) {
    ErrorCode errorCode = ErrorCode.BAD_REQUEST;
    ApiResponse<Object> response = ApiResponse.builder()
        .code(errorCode.getCode())
        .message(errorCode.getMessage())
        .build();
    return ResponseEntity.status(errorCode.getHttpStatus()).body(response);
  }

  @ExceptionHandler(value = HttpMediaTypeNotSupportedException.class)
  public ResponseEntity<ApiResponse<Object>> handleHttpMediaTypeNotSupportedException(
      HttpMediaTypeNotSupportedException exception) {
    ApiResponse<Object> response = ApiResponse.builder()
        .code(4150)
        .message("Unsupported media type: " + exception.getContentType())
        .build();
    return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE).body(response);
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
