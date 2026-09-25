# Smart CRM – Hệ thống tiếp nhận và phân loại yêu cầu bảo hành cho Mekong Mobile

**Sinh viên:** Trần Tấn Vũ – MSSV: 2374802010573  
**Track:** SE  
**Học phần:** Chuyên đề Tốt nghiệp 1 – Trường ĐH Văn Lang

## 1. Mô tả bài toán

Phiếu bảo hành ở trạng thái “Mới” → Quản lý phân công kỹ thuật viên phù hợp → Đặt lịch hẹn giao/nhận máy → Kỹ thuật viên nhận phiếu và xử lý → Cập nhật trạng thái đến khi hoàn tất.

## 2. Phạm vi

- **Làm:**
  1. Xem danh sách phiếu chờ phân công (theo ưu tiên và hạn cam kết)
  2. Đề xuất và phân công kỹ thuật viên phù hợp (tay nghề + khối lượng công việc)
  3. Đổi kỹ thuật viên và ghi lại lý do
  4. Đặt lịch hẹn giao – nhận máy (kiểm tra trùng lịch)
  5. Kỹ thuật viên xem danh sách phiếu được giao (sắp xếp theo hạn cam kết)
  6. Cập nhật trạng thái phiếu theo vòng đời
  7. Xem tổng quan khối lượng công việc và phiếu sắp quá hạn
- **Không làm:**
  - Tiếp nhận và phân loại yêu cầu (L2)
  - Quản lý kho linh kiện (L5)
  - Khảo sát hài lòng (L8)
  - Báo cáo doanh thu / phân khúc khách hàng
  - Tự động phân loại bằng AI (L10)

## 3. Công nghệ sử dụng

| Thành phần           | Công nghệ                              |
| -------------------- | -------------------------------------- |
| Backend              | Node.js (ExpressJS) / Java Spring Boot |
| Frontend             | ReactJS                                |
| Cơ sở dữ liệu        | MongoDB Atlas / PostgreSQL             |
| Triển khai & Công cụ | Render, Postman, Git                   |

## 4. Cấu trúc thư mục

```text
├── docs/              # SRS, sơ đồ, khai báo AI
│   └── diagrams/
├── src/
│   ├── backend/
│   └── frontend/
├── tests/
├── .env.example
├── .gitignore
└── README.md
```
