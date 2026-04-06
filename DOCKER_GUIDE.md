# Hướng dẫn cài đặt MySQL bằng Docker

> **Lưu ý:** Hướng dẫn này dành cho backend. Frontend authentication hiện tại đang được mock — không cần database để chạy frontend.

---

## 🧾 Tạo MySQL container bằng Docker

Chạy lệnh sau để tạo container MySQL:

```bash
docker run -d \
  --name mysql-db \
  -e MYSQL_ROOT_PASSWORD=123456 \
  -e MYSQL_DATABASE=labeling_system \
  -p 3306:3306 \
  mysql:8
```

### Giải thích tham số:

| Tham số | Ý nghĩa |
|---|---|
| `--name mysql-db` | Đặt tên container là `mysql-db` |
| `-e MYSQL_ROOT_PASSWORD=123456` | Password root: `123456` |
| `-e MYSQL_DATABASE=labeling_system` | Tự động tạo database `labeling_system` |
| `-p 3306:3306` | Map port 3306 của container ra port 3306 host |
| `mysql:8` | Sử dụng image MySQL phiên bản 8 |

### Kiểm tra container đã chạy chưa:

```bash
docker ps
```

Nếu thấy `mysql-db` trong danh sách → container đang chạy tốt.

---

## 🧾 Kết nối vào MySQL

Sau khi container chạy, kết nối vào MySQL CLI:

```bash
docker exec -it mysql-db mysql -u root -p
```

Nhập password: `123456`

---

## 🧾 Tạo tài khoản user theo role

Sau khi đã vào MySQL CLI, chạy các lệnh SQL sau:

```sql
-- Tạo user cho từng role
CREATE USER 'admin_user'@'%' IDENTIFIED BY '123456';
CREATE USER 'manager_user'@'%' IDENTIFIED BY '123456';
CREATE USER 'annotator_user'@'%' IDENTIFIED BY '123456';
CREATE USER 'reviewer_user'@'%' IDENTIFIED BY '123456';

-- Cấp quyền cho từng user
GRANT ALL PRIVILEGES ON labeling_system.* TO 'admin_user'@'%';
GRANT SELECT ON labeling_system.* TO 'manager_user'@'%';
GRANT SELECT ON labeling_system.* TO 'annotator_user'@'%';
GRANT SELECT ON labeling_system.* TO 'reviewer_user'@'%';

-- Áp dụng thay đổi
FLUSH PRIVILEGES;
```

---

## 🧾 Giải thích quyền

| User | Quyền | Vai trò |
|---|---|---|
| `admin_user` | `ALL PRIVILEGES` | Toàn quyền: đọc, ghi, sửa, xóa |
| `manager_user` | `SELECT` | Chỉ đọc dữ liệu |
| `annotator_user` | `SELECT` | Chỉ đọc dữ liệu |
| `reviewer_user` | `SELECT` | Chỉ đọc dữ liệu |

---

## 🧾 Kết nối từ backend

Thông tin kết nối để backend sử dụng:

```env
# Backend kết nối với admin_user (toàn quyền)
DB_HOST=localhost
DB_PORT=3306
DB_USER=admin_user
DB_PASSWORD=123456
DB_NAME=labeling_system
```

---

## 🧾 Dừng và xóa container

```bash
# Dừng container
docker stop mysql-db

# Xóa container
docker rm mysql-db
```

---

## ⚠️ Lưu ý quan trọng

1. **Frontend mock mode:** Hiện tại frontend sử dụng `mockAuth.js` — không cần backend hay database để login và test routing.
2. **Backend mới cần database:** Nếu bật backend thật, hãy đảm bảo MySQL container đang chạy và credentials đúng.
3. **Docker phải chạy:** Hướng dẫn này yêu cầu Docker Desktop (hoặc Docker Engine) đã được cài đặt và khởi động trên máy.
