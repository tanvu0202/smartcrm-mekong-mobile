# Smart CRM – Hệ thống phân công kỹ thuật viên và lịch hẹn bảo hành, Mekong Mobile (luồng L4)

**Sinh viên:** Trần Tấn Vũ – MSSV: 2374802010573  
**Track:** SE  
**Học phần:** Chuyên đề Tốt nghiệp 1 – Trường ĐH Văn Lang  
**Repository:** https://github.com/tanvu0202/smartcrm-mekong-mobile  
**Luồng nghiệp vụ:** L4 – Phân công kỹ thuật viên và lịch hẹn

## 1. Mô tả bài toán và phạm vi

Phiếu bảo hành ở trạng thái "Mới" → Quản lý phân công kỹ thuật viên phù hợp → Đặt lịch hẹn giao/nhận máy → Kỹ thuật viên nhận phiếu và xử lý → Cập nhật trạng thái đến khi hoàn tất.

- **Làm:** xem phiếu chờ phân công · đề xuất và phân công kỹ thuật viên · đổi kỹ thuật viên kèm lý do · đặt lịch hẹn (kiểm tra trùng) · KTV xem phiếu được giao · cập nhật trạng thái · tổng quan khối lượng.
- **Không làm:** tiếp nhận và phân loại yêu cầu (L2) · kho linh kiện (L5) · khảo sát hài lòng (L8) · báo cáo doanh thu · phân loại bằng AI (L10).

## 2. Yêu cầu môi trường và cách chạy

| Thành phần             | Phiên bản        | Ghi chú                         |
| ---------------------- | ---------------- | ------------------------------- |
| Node.js                | ≥ 20 (đã thử 22) | `node -v`                       |
| npm                    | ≥ 10             |                                 |
| PostgreSQL             | 16               | cần tạo sẵn database `smartcrm` |
| Git, curl hoặc Postman |                  | để gọi thử API                  |

```bash
git clone https://github.com/tanvu0202/smartcrm-mekong-mobile.git
cd smartcrm-mekong-mobile
npm install
cp .env.example .env          # rồi điền DB_USER, DB_PASSWORD (không commit .env)
createdb smartcrm             # hoặc tạo bằng pgAdmin
npm run migrate               # tạo 6 bảng + nạp dữ liệu danh mục (chạy lại được)
npm start                     # http://localhost:3000/api/health
npm test                      # unit test lớp nghiệp vụ (không cần DB); test tích hợp tự bỏ qua nếu thiếu TEST_DATABASE_URL
TEST_DATABASE_URL=postgresql://USER:PASS@localhost:5432/smartcrm npm test   # chạy cả 4 test tích hợp trên PostgreSQL thật
bash scripts/demo-curl.sh     # gọi thử các endpoint, ghi kết quả vào docs/ket-qua-chay/
```

Windows PowerShell: dùng `Copy-Item .env.example .env`; gọi API bằng `curl.exe` hoặc Postman.

## 3. Công nghệ sử dụng

| Thành phần    | Công nghệ                                          |
| ------------- | -------------------------------------------------- |
| Backend       | Node.js + Express, `pg` (không dùng ORM), `dotenv` |
| Frontend      | ReactJS (dựng khung, chưa hiện thực)               |
| Cơ sở dữ liệu | PostgreSQL 16                                      |
| Công cụ       | Postman/curl, Git, `node:test`                     |

## 4. Cấu trúc thư mục (ánh xạ sơ đồ kiến trúc 4 lớp)

```text
├── db/migrations/                  # L4 Dữ liệu: 001 tạo bảng (DDL của BT1), 002 dữ liệu danh mục
├── docs/                           # SRS, api-contract, thay-doi-thiet-ke, ai-disclosure, diagrams/, ket-qua-chay/
├── src/
│   ├── backend/
│   │   ├── index.js                # điểm vào, lắp ráp các lớp
│   │   ├── scripts/migrate.js
│   │   └── src/
│   │       ├── routes/             # L2 API – định tuyến
│   │       ├── controllers/        # L2 API – đọc request, trả response
│   │       ├── services/           # L3 Nghiệp vụ – QT-01..QT-06
│   │       ├── repositories/       # L4 Truy cập dữ liệu – chỉ SQL
│   │       ├── middleware/ config/ db.js errors.js app.js
│   └── frontend/src/pages/         # L1 Giao diện – M1, M2, M3 (khung)
├── tests/                          # unit test (repository giả) + tests/integration (PostgreSQL thật)
├── .env.example  .gitignore  package.json  README.md
```

| Lớp trong sơ đồ BT1             | Thư mục                                         |
| ------------------------------- | ----------------------------------------------- |
| L1 Giao diện React (M1, M2, M3) | `src/frontend/`                                 |
| L2 API (Controller/Route)       | `src/backend/src/routes`, `controllers`         |
| L3 Nghiệp vụ (QT-01..06)        | `src/backend/src/services`                      |
| L4 Dữ liệu (6 bảng)             | `src/backend/src/repositories`, `db/migrations` |

## 5. Tài liệu

[SRS](docs/srs.md) · [Hợp đồng API](docs/api-contract.md) · [Nhật ký thay đổi thiết kế](docs/thay-doi-thiet-ke.md) · [Sơ đồ draw.io](docs/diagrams/) · [Khai báo AI](docs/ai-disclosure.md)

## 6. Trạng thái hiện tại (Sprint 1 – buổi 8, 19/10/2026)

| Hạng mục                                                                                                                        | Trạng thái                      |
| ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Phản hồi BT1 → `docs/thay-doi-thiet-ke.md` (TD-01..12)                                                                          | Xong                            |
| Migration 6 bảng theo DDL BT1 + dữ liệu danh mục                                                                                | Xong, chạy lại an toàn          |
| CRUD `ticket` (routes → service → repository)                                                                                   | Xong                            |
| Đề xuất KTV, phân công (`assign`), đổi KTV (`reassign`), ghi `ticket_log` cùng transaction, khóa dòng chống phân công đồng thời | Xong (QT-01..04, QT-06)         |
| Unit test lớp nghiệp vụ                                                                                                         | 15 test, đều qua                |
| Test tích hợp trên PostgreSQL: câu truy vấn đề xuất KTV, hai yêu cầu phân công đồng thời                                        | 4 test, đều qua (TD-06, TD-07)  |
| Đặt lịch hẹn, kiểm tra trùng giờ (QT-05)                                                                                        | **Chưa** – Sprint 2 (TD-12)     |
| Cập nhật trạng thái DANG_XU_LY / HOAN_TAT, tổng quan khối lượng                                                                 | **Chưa**                        |
| Giao diện React                                                                                                                 | **Chưa** – chỉ có khung thư mục |

**Quyết định kỹ thuật / lỗi đã gặp:** (điền khi chạy trên máy — ví dụ lỗi kết nối DB, cổng 3000 bị chiếm).

## 7. Khai báo sử dụng AI

Xem [docs/ai-disclosure.md](docs/ai-disclosure.md).
