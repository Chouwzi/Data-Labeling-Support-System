package com.uth.datalabeling.common.exception;

import lombok.Getter;

@Getter
public enum ErrorCode {

  // 400 Bad Request
  BAD_REQUEST(400, 40000, "Yêu cầu không hợp lệ"),
  MISSING_REQUIRED_FIELD(400, 40001, "Thiếu trường bắt buộc"),

  // 401 Unauthorized
  UNAUTHORIZED(401, 40100, "Chưa xác thực"),
  INVALID_CREDENTIALS(401, 40101, "Sai thông tin đăng nhập"),
  TOKEN_EXPIRED(401, 40102, "Token hết hạn"),
  TOKEN_INVALID(401, 40103, "Token không hợp lệ"),

  // 403 Forbidden
  FORBIDDEN(403, 40300, "Không có quyền truy cập"),

  // 404 Not Found
  NOT_FOUND(404, 40400, "Không tìm thấy tài nguyên"),
  USER_NOT_FOUND(404, 40401, "Không tìm thấy người dùng"),
  PROJECT_NOT_FOUND(404, 40402, "Không tìm thấy dự án"),
  LABEL_NOT_FOUND(404, 40403, "Không tìm thấy nhãn dán"),

  // 405 Method Not Allowed
  METHOD_NOT_ALLOWED(405, 40500, "Phương thức không được hỗ trợ"),

  // 409 Conflict
  CONFLICT(409, 40900, "Xung đột dữ liệu"),
  USER_ALREADY_EXISTS(409, 40901, "Email đã tồn tại"),
  PROJECT_ALREADY_EXISTS(409, 40902, "Tên dự án đã tồn tại"),
  LABEL_ALREADY_EXISTS(409, 40903, "Nhãn dán đã tồn tại trong dự án"),

  // 415 Unsupported Media Type
  UNSUPPORTED_MEDIA_TYPE(415, 41500, "Kiểu dữ liệu không hỗ trợ"),

  // 422 Unprocessable Content
  VALIDATION_ERROR(422, 42200, "Dữ liệu đầu vào không hợp lệ"),
  PASSWORD_TOO_SHORT(422, 42201, "Mật khẩu phải có ít nhất 8 ký tự"),
  INVALID_MAX_IMAGE_FILE_SIZE(422, 42202, "Kích thước file ảnh tối đa phải trong khoảng 1-100 MB"),
  INVALID_DEFAULT_PAGE_SIZE(422, 42203, "Kích thước trang mặc định phải trong khoảng 5-200"),
  INVALID_ALLOWED_IMAGE_EXTENSIONS(422, 42204, "Danh sách định dạng ảnh cho phép tối đa 10 phần tử"),
  INVALID_IMAGE_EXTENSION(422, 42205, "Định dạng ảnh chỉ được chứa chữ và số"),

  // 429 Too Many Requests
  TOO_MANY_REQUESTS(429, 42900, "Vượt quá giới hạn yêu cầu"),

  // 500 Internal Server Error
  INTERNAL_SERVER_ERROR(500, 50000, "Lỗi hệ thống"),
  DATABASE_ERROR(500, 50001, "Lỗi truy vấn dữ liệu"),

  // 503 Service Unavailable
  SERVICE_UNAVAILABLE(503, 50300, "Dịch vụ tạm thời gián đoạn");

  private final int httpStatus;
  private final int code;
  private final String message;

  private ErrorCode(int httpStatus, int code, String message) {
    this.httpStatus = httpStatus;
    this.code = code;
    this.message = message;
  }
}
