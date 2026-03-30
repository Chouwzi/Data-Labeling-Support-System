# Data Labeling Support System - Frontend

Đây là kho lưu trữ mã nguồn Frontend cho **Hệ thống hỗ trợ gán nhãn dữ liệu**, được xây dựng để tối ưu hóa toàn bộ vòng đời chuẩn bị dữ liệu cho các mô hình Học máy (Machine Learning). 

Dự án áp dụng các tiêu chuẩn thiết kế UI/UX hiện đại của năm 2026, lấy cảm hứng từ các nền tảng SaaS hàng đầu như Roboflow, tập trung vào hiệu suất cao, không gian làm việc tối giản và các tương tác vi mô (micro-interactions) tinh tế.

## Tech Stack

* **Framework:** React 18+
* **Build Tool:** Vite (Cung cấp tốc độ khởi động và HMR siêu tốc)
* **Styling:** CSS Custom Properties & Glassmorphism UI (Thiết kế hệ thống giao diện độc quyền)
* **Icons:** Lucide React / Phosphor Icons

## Tính năng nổi bật

* **Giao diện Đăng nhập Cấp Doanh nghiệp:** Trải nghiệm xác thực mượt mà với hiệu ứng động và phản hồi trực quan (Task: LTJ-124).
* **Workspace Đa Vai Trò:** Tùy biến giao diện chuyên sâu cho từng nhóm người dùng (Admin, Manager, Annotator, Reviewer).
* **Canvas Gán Nhãn Tương Tác:** Khu vực làm việc tập trung, hỗ trợ phím tắt (hotkeys) để tối đa hóa tốc độ vẽ khung (bounding box) và phân đoạn (segmentation).
* **AI Pre-labeling UI:** Tích hợp giao diện nhận diện và phê duyệt các nhãn do AI gợi ý nháp.

## Hướng dẫn cài đặt

### Yêu cầu môi trường
Đảm bảo máy tính của bạn đã cài đặt **Node.js (phiên bản 18.x trở lên)**.

### Các bước chạy dự án

1. Clone repository về máy tính:
   ```bash
   git clone <đường-dẫn-repo-của-bạn>
   cd <thư-mục-frontend>