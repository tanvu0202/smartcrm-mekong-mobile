# Giao diện (L1) – Mekong Mobile · Phân công kỹ thuật viên

React 19 + Vite 6. Chạy từ thư mục gốc của repo: `npm run install:all`, rồi `npm run web` (cần backend đang chạy ở cổng 3000).

| Màn hình | Đường dẫn (hash) | Vai trò |
|---|---|---|
| Đăng nhập | `#/login` | mọi người |
| M1 Danh sách phiếu | `#/queue` | quản lý |
| M2 Chi tiết và phân công | `#/tickets/:id` | quản lý |
| M3 Phiếu của tôi / theo kỹ thuật viên | `#/my` | kỹ thuật viên (phiếu của mình); quản lý (chọn kỹ thuật viên) |

Quy ước:

- `src/api/client.js` là nơi **duy nhất** gọi `fetch`. Kiểm tra: tìm `fetch(` trong `src/pages/` phải không có kết quả.
- `src/api/contract.js` đổi snake_case của backend sang camelCase ở một chỗ; thiếu trường bắt buộc thì báo `BAD_CONTRACT` thay vì hiện "undefined".
- Mỗi trang bọc dữ liệu bằng `components/DataState.jsx`: đang tải · lỗi (kèm nút Thử lại) · rỗng · có dữ liệu.
- Nhận 401 → `client.js` xóa token rồi `App.jsx` đưa về `#/login` kèm thông báo "Phiên đăng nhập đã hết hạn".
- Cấu hình: `src/frontend/.env` (không commit), mẫu ở `.env.example` – chỉ cần khi backend không ở `http://localhost:3000`.
- Test của phần này nằm ở `tests/frontend/` ở thư mục gốc (chạy bằng `npm test`).
