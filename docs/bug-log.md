# Nhật ký lỗi (bug log)

Mỗi lỗi gồm 7 dòng: dòng tiêu đề, rồi triệu chứng, và đúng bốn bước xử lý — **tái hiện → định vị → sửa nguyên nhân → xác nhận** — kèm commit sửa.
Chỉ ghi lỗi có thật đã gặp khi làm dự án; dòng "Commit sửa" ghi mã rút gọn của commit trong `git log`.

### BUG-01 – 7 test tích hợp báo `SASL: client password must be a string` (23/10/2026)
- Triệu chứng : `npm test` báo 83 pass nhưng 7 test trong `tests/integration/` lỗi, các test còn lại vẫn xanh.
- Tái hiện : trong shell đang có biến `TEST_DATABASE_URL` sai (thiếu mật khẩu), chạy `npm test`; lỗi lặp lại đúng 7 test dùng `pg.Pool`.
- Định vị : lỗi chỉ ở các test mở kết nối PostgreSQL và thông báo đến từ thư viện `pg` (không có mật khẩu dạng chuỗi) nên nguyên nhân là chuỗi kết nối trong môi trường, không phải mã nghiệp vụ.
- Sửa nguyên nhân : thêm `npm run test:full` (`scripts/chay-test-day-du.js`) tự lắp `TEST_DATABASE_URL` từ `.env` thay vì bắt người dùng gõ biến; thêm dòng xử lý vào README "Lỗi thường gặp".
- Xác nhận : `npm run test:full` → pass 90, fail 0 (nay pass 100 sau khi thêm test lịch hẹn); mật khẩu không hiện ra màn hình.
- Commit sửa : b1a2d79 (script) · 0a94bac (README).

### BUG-02 – `npm run install:all` lỗi khi dựng thử trên Windows (23/10/2026)
- Triệu chứng : bước cài thư viện của `scripts/thu-clone-moi.sh` dừng ở `npm run install:all`.
- Tái hiện : Git Bash trên Windows, clone mới, chạy `bash scripts/thu-clone-moi.sh`; dừng ở "Bước 3 – cài thư viện".
- Định vị : `install:all` gọi `npm install && npm --prefix src/frontend install`; chỉ lệnh có `--prefix` là phần khác so với `npm install` thông thường.
- Sửa nguyên nhân : đổi thành `npm install && cd src/frontend && npm install`, không phụ thuộc cờ `--prefix`.
- Xác nhận : chạy lại `bash scripts/thu-clone-moi.sh` trên máy thật → cả 8 bước ĐẠT (ảnh trong `docs/ket-qua-chay/`).
- Commit sửa : 683f631.

### BUG-03 – script dựng thử clone nhầm nhánh: `Missing script: "install:all"` (23/10/2026)
- Triệu chứng : bản clone mới không có script `install:all` dù bản đang làm có.
- Tái hiện : đang ở nhánh `dev`, chạy `bash scripts/thu-clone-moi.sh`; script clone về nhánh mặc định của GitHub.
- Định vị : so `package.json` của bản clone với bản đang làm thấy khác nhau; nhánh mặc định trên GitHub chưa có các commit của `dev`, nên thiếu script.
- Sửa nguyên nhân : script lấy tên nhánh hiện tại và clone bằng `git clone -b <nhánh>`; thêm `scripts/thu-clone-tag.sh` để thử đúng thẻ `v0.2`.
- Xác nhận : chạy lại → bản clone có `install:all`, các bước 3–8 ĐẠT.
- Commit sửa : 96a46f9.

### BUG-04 – `Device or resource busy` khi script ghi nhật ký (23/10/2026)
- Triệu chứng : script dừng ở bước 5 (`npm run migrate`) với thông báo `Device or resource busy` thay vì kết quả của bước.
- Tái hiện : trên Windows, chạy `bash scripts/thu-clone-moi.sh` khi tệp `docs/ket-qua-chay/thu-clone-moi.txt` đang mở trong VS Code; chưa tái hiện được trên Linux.
- Định vị : thông báo đến từ thao tác ghi nối (`>>`) vào chính tệp nhật ký nằm trong repo, không phải từ `npm`; nghi do Windows khóa tệp đang được trình soạn thảo mở (chưa kiểm chứng chắc chắn).
- Sửa nguyên nhân : ghi nhật ký vào tệp tạm (`mktemp`) trong suốt quá trình chạy, cuối cùng mới chép vào `docs/ket-qua-chay/`.
- Xác nhận : chạy lại → không còn lỗi, cả 8 bước ĐẠT.
- Commit sửa : 1b67bc9.

### BUG-05 – hủy lịch hẹn rồi đặt lại đúng khung giờ cũ bị chặn `23505` (30/10/2026)
- Triệu chứng : sau khi hủy (xóa mềm) một lịch hẹn, đặt lại cùng phiếu, cùng loại, cùng giờ bắt đầu báo `duplicate key value violates unique constraint`.
- Tái hiện : viết test tích hợp "hủy rồi đặt lại" (`tests/integration/appointment.test.js`) và chạy với CSDL chưa có migration 003 → test lỗi với mã `23505`.
- Định vị : ràng buộc `UNIQUE (ticket_id, appointment_type, start_time)` của bảng `appointment` tính cả dòng `DA_HUY`, trong khi hủy chỉ đổi `status` chứ không xóa dòng.
- Sửa nguyên nhân : migration `003_appointment_unique_active.sql` bỏ ràng buộc cũ, thay bằng chỉ mục duy nhất một phần `WHERE status = 'DA_DAT'` (chạy lại nhiều lần vẫn an toàn).
- Xác nhận : áp migration → test tích hợp "CRUD lịch hẹn" xanh; hoàn nguyên ràng buộc cũ thì test lỗi lại `23505`; `npm run migrate` lần hai báo "bỏ qua".
- Commit sửa : xem `git log --oneline -- db/migrations/003_appointment_unique_active.sql`.
