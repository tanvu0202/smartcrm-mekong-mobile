# Test Plan – Buổi 14 (Bài tập 3)

Hệ thống: Smart CRM Mekong Mobile, luồng **L4 – Phân công kỹ thuật viên và lịch hẹn bảo hành**. Người lập: Trần Tấn Vũ (2374802010573). Ngày: 06/11/2026.

## 1. Phạm vi và phần chủ ý không kiểm

**Kiểm:** toàn bộ API của L4 (`/tickets`, `/assign`, `/reassign`, `/status`, `/appointments`, `/auth`) cùng quy tắc nghiệp vụ QT-01..QT-06 (vòng đời phiếu, một KTV mỗi phiếu, cùng trung tâm, lý do khi đổi KTV, **không trùng lịch**, cảnh báo quá tải); kiểm tra dữ liệu đầu vào; phân quyền quản lý / kỹ thuật viên; migration và seed chạy lại được; logic thuần của giao diện (định dạng giờ, tổng quan, phân trang, router).

**Chủ ý không kiểm** (kèm lý do):
- Giao diện trên trình duyệt thật (E2E tự động): chỉ kiểm thủ công khi quay video/ảnh Buổi 10; dự án không dựng Playwright vì tốn thời gian hơn lợi ích ở quy mô này.
- Hiệu năng / tải (NFR01 ≤ 2 giây): chỉ đo tay trên dữ liệu demo, không chạy công cụ tải.
- Thông báo SMS / email cho khách (FR07, US07): đã cắt khỏi phạm vi (TD-15) vì cần dịch vụ ngoài.
- Bảo mật hạ tầng (HTTPS, chống dò mật khẩu, thu hồi token): ngoài phạm vi đăng nhập tối thiểu (TD-14).
- Luồng L2 (tiếp nhận phiếu) và các luồng L1, L3, L5: thuộc nhóm khác.

## 2. Loại test và số lượng mỗi tầng

| Tầng | Công cụ | Số lượng | Chạy bằng |
|---|---|---|---|
| Đơn vị – backend (service, controller, auth; repository giả) | `node:test` | 72 | `npm test` |
| Đơn vị – logic giao diện | `node:test` (.mjs) | 42 | `npm test` |
| Tích hợp trên PostgreSQL thật (SQL, khóa dòng, đồng thời, thứ tự lịch sử) | `node:test` + `pg` | 10 | `npm run test:full` |
| **Hệ thống / API từ đầu đến cuối (test case thủ công có kịch bản)** | `scripts/chay-test-case.js` | **12** | `npm run tc:all` |

Tổng tự động: 124 test (`npm test`: 114 chạy + 10 tích hợp được bỏ qua nếu chưa có CSDL; `npm run test:full`: 124). Mười hai test case hệ thống phân theo năm loại: luồng đúng (TC-01, 02), biên (TC-03, 04, 11), dữ liệu sai (TC-06, 07, 08), nghiệp vụ QT-05 khi đổi KTV (TC-05), bảo mật / chất lượng dữ liệu (TC-09, 10), tái lập (TC-12). Ưu tiên **Cao** cho case chạm quy tắc nghiệp vụ hoặc phân quyền (TC-01..06, 09, 10), **Trung bình** cho kiểm tra dữ liệu và tái lập (TC-07, 08, 11, 12).

## 3. Tiêu chí thành công (đo được)

1. 12/12 test case hệ thống PASS ở lượt chạy cuối, mỗi case có ảnh chụp terminal trong `docs/screenshots/`.
2. `npm run test:full` đạt 124 pass, 0 fail.
3. Không còn bug mức Critical / Major đang mở; mọi bug đã sửa có **một commit riêng** `fix(...): ... (BUG-xx)` và ít nhất một test hồi quy đỏ khi bỏ bản sửa, xanh khi có bản sửa.
4. Với các loại dữ liệu sai đã chọn kiểm (ngày, tên, số điện thoại, độ dài chuỗi), API trả 400 (hoặc 409 / 422 khi vi phạm nghiệp vụ), không trả **5xx**. Đếm 5xx trong 12 test case = 0 ở lượt cuối. Giới hạn đã biết, chủ ý chưa kiểm: số nguyên vượt khoảng INT4 (ví dụ `centerId` 99999999999) vẫn gây 500.
5. Chạy lại migration / seed lần hai: số dòng các bảng danh mục không đổi (TC-12).

## 4. Môi trường và dữ liệu thử

- **Môi trường:** Windows + Git Bash, Node.js 22, PostgreSQL 16 cục bộ, cơ sở dữ liệu `smartcrm` đã `npm run migrate` (001–003). Test case tự bật backend tạm từ mã nguồn hiện tại nên không phụ thuộc việc `npm start` đang chạy bản nào.
- **Dữ liệu nền:** seed `002` (2 trung tâm, 5 kỹ thuật viên, 3 phiếu mẫu) và 3 tài khoản demo (`dieu.phoi` quản lý; `ktv.hai`, `ktv.long` kỹ thuật viên cùng trung tâm Quận 1).
- **Dữ liệu từng case:** mỗi case tự tạo phiếu riêng ("TC khach …") và đặt lịch ở một ngày ngẫu nhiên trong năm 2100–2249 để các lần chạy không đụng nhau; không sửa dữ liệu seed.
- **Giá trị biên đã chọn (hai phía):**

| Đầu vào | Hợp lệ | Không hợp lệ | Case |
|---|---|---|---|
| Hai lịch của cùng KTV | chạm đầu mút 03:00 = 03:00 | chồng 1 giây (02:59:59) | TC-03, TC-04 |
| Tên khách hàng (VARCHAR 100) | 100 ký tự | 101 ký tự; chỉ dấu cách | TC-11, TC-07 |
| Số điện thoại | `+84912345678` (8–15 chữ số, một dấu + đầu) | `++++++++` | TC-08 |
| Ngày | 28/02 · 29/02/2028 (năm nhuận) | 30/02 (năm 2027 và năm 2100–2249) | TC-06 + test đơn vị `dateValidation` |
| Lý do đổi KTV (VARCHAR 255) | 255 ký tự | 256 ký tự | test đơn vị `inputLimits` |
| Quyền | quản lý · KTV đúng phiếu của mình | không token · KTV xem / đổi phiếu người khác | TC-09 |
