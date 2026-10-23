# Smart CRM – Hệ thống phân công kỹ thuật viên và lịch hẹn bảo hành, Mekong Mobile (luồng L4)

**Sinh viên:** Trần Tấn Vũ – MSSV: 2374802010573  
**Track:** SE  
**Học phần:** Chuyên đề Tốt nghiệp 1 – Trường ĐH Văn Lang  
**Repository:** https://github.com/tanvu0202/smartcrm-mekong-mobile  
**Luồng nghiệp vụ:** L4 – Phân công kỹ thuật viên và lịch hẹn

## 1. Mô tả bài toán và phạm vi

Phiếu bảo hành ở trạng thái "Mới" → Quản lý phân công kỹ thuật viên phù hợp → (đổi kỹ thuật viên nếu cần, bắt buộc nêu lý do) → Kỹ thuật viên xem phiếu được giao.

- **Làm (đến Sprint 2):** đăng nhập theo vai trò · xem và lọc phiếu chờ phân công (M1) · đề xuất, phân công, đổi kỹ thuật viên kèm lý do và xem lịch sử (M2) · kỹ thuật viên xem phiếu của mình (M3) · CRUD phiếu ở API.
- **Chưa làm (đã cắt có lý do, xem [TD-15](docs/thay-doi-thiet-ke.md)):** đặt lịch hẹn và kiểm tra trùng giờ (QT-05) · cập nhật trạng thái DANG_XU_LY / HOAN_TAT · tổng quan khối lượng · thông báo lịch hẹn cho khách.
- **Không làm (ngoài phạm vi L4):** tiếp nhận và phân loại yêu cầu (L2) · kho linh kiện (L5) · khảo sát hài lòng (L8) · báo cáo doanh thu · phân loại bằng AI (L10).

## 2. Yêu cầu môi trường

| Thành phần | Phiên bản | Ghi chú |
|---|---|---|
| Node.js | ≥ 20 (đã thử 22) | `node -v` |
| npm | ≥ 10 | `npm -v` |
| PostgreSQL | 16 | đang chạy; biết tên người dùng và mật khẩu |
| Git | | `git --version` |
| Trình duyệt | Chrome / Edge mới | để mở giao diện |

Cổng dùng: **3000** (backend), **5173** (giao diện). Không cần cài `psql` hay `createdb`: bước tạo database dùng Node.

## 3. Các bước dựng hệ thống (mỗi bước một lệnh)

Chạy trong Git Bash hoặc terminal của VS Code. Trên Windows PowerShell chỉ khác bước 2 (`Copy-Item .env.example .env`).

| Bước | Lệnh | Kết quả mong đợi |
|---|---|---|
| 1 | `git clone https://github.com/tanvu0202/smartcrm-mekong-mobile.git && cd smartcrm-mekong-mobile` | Có thư mục dự án |
| 2 | `cp .env.example .env` rồi mở `.env` điền `DB_USER`, `DB_PASSWORD`, `AUTH_SECRET` (một chuỗi dài bất kỳ) | Có file `.env` (đã bị git bỏ qua, **không commit**) |
| 3 | `npm run install:all` | Cài thư viện cho backend và giao diện, không báo `ERR!` |
| 4 | `npm run db:create` | `Đã tạo database "smartcrm"` (hoặc `đã có – bỏ qua`) |
| 5 | `npm run migrate` | `đã chạy 001_…`, `đã chạy 002_…` (chạy lại thì `bỏ qua`) |
| 6 | `npm test` | `pass 54`, `fail 0` (4 test tích hợp được bỏ qua nếu chưa đặt `TEST_DATABASE_URL`) |
| 7 | `npm start` (cửa sổ terminal 1) | `Mekong L4 API chạy tại http://localhost:3000` |
| 8 | `npm run web` (cửa sổ terminal 2) | Mở http://localhost:5173 → trang Đăng nhập |

**Tài khoản demo** (mật khẩu chung `demo123`, đổi bằng `DEMO_PASSWORD` trong `.env`):

| Tên đăng nhập | Vai trò | Thấy gì |
|---|---|---|
| `dieu.phoi` | Quản lý | M1 danh sách phiếu · M2 chi tiết và phân công · M3 xem theo từng kỹ thuật viên |
| `ktv.hai`, `ktv.long` | Kỹ thuật viên | Chỉ M3 "Phiếu của tôi" (server chỉ trả phiếu của chính họ) |

**Thử nhanh các tình huống chính:**

- Đăng nhập `dieu.phoi` → M1 → bấm một phiếu → chọn kỹ thuật viên đề xuất → *Phân công* → *Xác nhận*.
- Vẫn ở M2: chọn kỹ thuật viên khác, nhập lý do → *Đổi kỹ thuật viên*; lịch sử hiện thêm một dòng.
- Đăng xuất, đăng nhập `ktv.hai` → thấy phiếu vừa giao; đăng nhập `ktv.long` (chưa có phiếu) → trạng thái rỗng.
- Tắt backend (Ctrl+C ở terminal 1) rồi bấm *Tải lại* → thông báo lỗi kèm nút *Thử lại*; bật lại backend, bấm *Thử lại* → dữ liệu hiện lại.
- Khởi động lại backend khi đang đăng nhập mà `AUTH_SECRET` đổi → lần gọi kế tiếp nhận 401, giao diện xóa token và về trang Đăng nhập.

**Kiểm chứng bước 1–8 trên một thư mục clone mới:** `bash scripts/thu-clone-moi.sh` (clone từ GitHub vào thư mục khác, làm lần lượt các bước trên, ghi `docs/ket-qua-chay/thu-clone-moi.txt`).

**Gọi thử API bằng curl:** `bash scripts/demo-curl.sh` (tự đăng nhập, ghi kết quả vào `docs/ket-qua-chay/`).

**Chạy cả 4 test tích hợp trên PostgreSQL thật:** `npm run test:full` (tự đọc thông tin CSDL từ `.env`) → `pass 58`.

**Lỗi thường gặp:**

| Triệu chứng | Cách xử lý |
|---|---|
| `password authentication failed` ở bước 4 hoặc 5 | `DB_USER` / `DB_PASSWORD` trong `.env` sai |
| `EADDRINUSE :::3000` ở bước 7 | cổng 3000 đang bị chiếm: tắt backend cũ hoặc đặt `PORT=3001` trong `.env` (và `VITE_API_PROXY=http://localhost:3001` trong `src/frontend/.env`) |
| Giao diện báo "Không kết nối được máy chủ" | backend chưa chạy (bước 7) |
| Bị đưa về trang Đăng nhập sau khi khởi động lại backend | chưa đặt `AUTH_SECRET` trong `.env` nên mỗi lần khởi động token cũ mất hiệu lực |

## 4. Công nghệ và cấu trúc thư mục

| Thành phần | Công nghệ |
|---|---|
| Backend | Node.js + Express, `pg` (không dùng ORM), `dotenv`; token đăng nhập dựng bằng `node:crypto` (HS256) |
| Frontend | ReactJS 19 + Vite 6, bộ định tuyến theo hash tự viết (không thêm thư viện) |
| Cơ sở dữ liệu | PostgreSQL 16 |
| Công cụ | Postman/curl, Git, `node:test` |

```text
├── db/migrations/                  # L4 Dữ liệu: 001 tạo bảng (DDL của BT1), 002 dữ liệu danh mục
├── docs/                           # SRS, api-contract, thay-doi-thiet-ke, ai-disclosure, diagrams/, ket-qua-chay/
├── scripts/                        # demo-curl.sh, thu-clone-moi.sh
├── src/
│   ├── backend/
│   │   ├── index.js                # điểm vào, lắp ráp các lớp
│   │   ├── scripts/                # migrate.js, create-db.js
│   │   └── src/
│   │       ├── routes/ controllers/    # L2 API
│   │       ├── services/               # L3 Nghiệp vụ – QT-01..04, QT-06 và đăng nhập
│   │       ├── repositories/           # L4 Truy cập dữ liệu – chỉ SQL
│   │       └── auth/ middleware/ config/ db.js errors.js app.js
│   └── frontend/src/
│       ├── api/                    # client.js (nơi DUY NHẤT gọi fetch), contract.js, *.api.js
│       ├── components/ hooks/ lib/ # DataState, useApi, bộ định tuyến, định dạng
│       └── pages/                  # L1 Giao diện: Login, M1 (TicketQueue), M2 (Assign), M3 (MyTickets)
├── tests/                          # backend: unit + tests/integration · tests/frontend: client, hợp đồng dữ liệu, trạng thái
├── .env.example  .gitignore  package.json  README.md
```

| Lớp trong sơ đồ BT1 | Thư mục |
|---|---|
| L1 Giao diện React (M1, M2, M3) | `src/frontend/` |
| L2 API (Controller/Route) | `src/backend/src/routes`, `controllers` |
| L3 Nghiệp vụ | `src/backend/src/services` |
| L4 Dữ liệu (6 bảng) | `src/backend/src/repositories`, `db/migrations` |

Quy ước giao diện: trang trong `pages/` **không** gọi `fetch`; mọi lời gọi mạng đi qua `api/client.js`. Mỗi trang bọc dữ liệu bằng `<DataState>` (đang tải / lỗi kèm nút Thử lại / rỗng / có dữ liệu).

## 5. Tài liệu

[SRS](docs/srs.md) · [Hợp đồng API](docs/api-contract.md) · [Nhật ký thay đổi thiết kế](docs/thay-doi-thiet-ke.md) · [Wireframe](docs/diagrams/wireframe.md) · [Sơ đồ draw.io](docs/diagrams/) · [Kết quả chạy](docs/ket-qua-chay/) · [Khai báo AI](docs/ai-disclosure.md)

## 6. Trạng thái hiện tại (Sprint 2 – Buổi 10, 23/10/2026)

| Hạng mục | Trạng thái |
|---|---|
| Sprint 1: migration 6 bảng, CRUD phiếu, đề xuất / phân công / đổi KTV, `ticket_log` cùng transaction, khóa dòng | Xong (TD-06, TD-07) |
| Đăng nhập theo vai trò, 401 / 403, KTV chỉ thấy phiếu của mình | Xong (TD-14, TD-16) |
| Giao diện: Đăng nhập + 3 màn hình M1, M2, M3 gọi API thật, mỗi màn bọc `DataState` | Xong |
| Luồng chính chạy trọn: đăng nhập → danh sách → phân công → đổi KTV → KTV xem phiếu | Xong, đã chạy bằng trình duyệt thật trên dữ liệu mẫu |
| Dừng backend → thông báo lỗi + nút Thử lại; token hết hạn → về trang Đăng nhập | Xong |
| Tìm `fetch(` trong `src/frontend/src/pages/` | Không có kết quả |
| Số test | 58: 54 chạy không cần CSDL (15 + 15 backend, 24 giao diện), 4 tích hợp cần `TEST_DATABASE_URL` |
| Đặt lịch hẹn (QT-05), cập nhật trạng thái, tổng quan khối lượng, thông báo | **Chưa – đã cắt** (TD-15) |
| Thử dựng trên clone mới | _(ghi ngày và kết quả sau khi chạy `bash scripts/thu-clone-moi.sh`)_ |

**Quyết định kỹ thuật / lỗi đã gặp:** xem [thay-doi-thiet-ke.md](docs/thay-doi-thiet-ke.md) (TD-14 đến TD-16). _(Bổ sung lỗi thực tế gặp trên máy, ví dụ cổng bị chiếm, sai mật khẩu DB.)_

## 7. Khai báo sử dụng AI

Xem [docs/ai-disclosure.md](docs/ai-disclosure.md).
