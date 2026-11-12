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

## Buổi 14 – Lỗi tìm thấy khi kiểm thử hệ thống (Bài tập 3)

Bảy dòng mỗi lỗi: mã và mức độ · phát hiện bởi · triệu chứng · cách tái lập · nguyên nhân (nơi sai trong mã) · cách sửa · commit và xác nhận. Mỗi lỗi sửa trong **một commit riêng** `fix(phạm-vi): … (BUG-xx)`; ảnh chạy lại toàn bộ bộ test sau khi sửa nằm ở `docs/screenshots/BUG-xx-fixed.png`. Có thể chứng minh lại trên máy: `bash scripts/chung-minh-hoi-quy.sh BUG-xx` (đưa tạm mã về trước commit sửa → test đỏ → khôi phục → test xanh).

### BUG-06 – Major – lịch sử thay đổi của phiếu có thể hiện sai thứ tự khi hai thay đổi đồng thời
- Phát hiện bởi : test tích hợp tự động `tests/integration/assign.concurrency.test.js` ("2 yêu cầu ĐỔI KTV đồng thời … log khớp") báo đỏ **ngẫu nhiên** khi chạy lặp nhiều lần cả bộ test (khoảng 1 trong 14 lần lúc kiểm thử); sau đó dựng lại bằng một test tất định.
- Triệu chứng : lỗi `Expected values to be strictly equal` ở dòng kiểm tra chuỗi log liền mạch (`old_technician_id` của dòng sau ≠ `new_technician_id` của dòng trước). Với người dùng: `GET /tickets/{id}/history` (khối "Lịch sử" ở M2) hiện hai thay đổi đồng thời sai thứ tự, chuỗi "KTV cũ → KTV mới" bị đứt (NFR05: nhật ký phải đáng tin).
- Tái lập : `node --test tests/integration/history.order.test.js` (cần `TEST_DATABASE_URL`, hoặc `npm run test:full`) trước commit sửa: transaction B bắt đầu trước nhưng ghi sau transaction A → lịch sử trả B trước A.
- Nguyên nhân : `src/backend/src/repositories/ticketLogRepository.js`, hàm `findByTicket`: `ORDER BY changed_at, log_id`. Cột `changed_at` mặc định `now()` là giờ **bắt đầu transaction**, không phải lúc ghi; hai yêu cầu cùng chờ khóa dòng phiếu có thể nhận khóa ngược với thứ tự bắt đầu, nên dòng ghi sau lại có `changed_at` sớm hơn và bị xếp lên trước.
- Cách sửa : đổi thành `ORDER BY log_id`. `log_id` (BIGSERIAL) được cấp khi INSERT, sau khi transaction đã giữ khóa dòng phiếu, nên luôn đúng thứ tự thực hiện; vẫn trả `changed_at` để hiển thị. Test hồi quy tất định `tests/integration/history.order.test.js`.
- Commit và xác nhận : [`c6c9afc`](https://github.com/tanvu0202/smartcrm-mekong-mobile/commit/c6c9afcdac52b5244cb205f3a9bff83dea41cbb0) · test tất định đỏ khi bỏ bản sửa (`['ghi-sau', 'ghi-truoc']`), xanh khi có; `npm run test:full` 0 fail (ảnh `BUG-06-fixed.png`). Lỗi này không thuộc test case hệ thống nào vì chỉ lộ khi hai yêu cầu chồng thời gian.

### BUG-07 – Major – đổi kỹ thuật viên sang người đã có lịch trùng giờ vẫn thành công
- Phát hiện bởi : test case TC-05 (kiểm thử khám phá bằng cách gọi API trước, sau đó đóng gói thành test case) – FAIL ở lượt chạy 1.
- Triệu chứng : `POST /tickets/{id}/reassign` trả **200** dù KTV mới đã có lịch cùng khung giờ; sau đó một KTV có hai lịch hẹn chồng nhau và phiếu bị chuyển sang người mới (vi phạm QT-05, US04). Ghi nhận ở TC-05: `HTTP 200 … KTV của phiếu A sau đó = Long (đã bị đổi!)`.
- Tái lập : `npm run tc -- TC-05` – phiếu A (KTV Hải) và phiếu B (KTV Long) cùng có lịch 02:00–03:00 (UTC) ngày X; đổi phiếu A sang Long kèm lý do.
- Nguyên nhân : `src/backend/src/services/ticketService.js`, hàm `changeAssignment`, nhánh `isChange` (đổi KTV): chỉ kiểm tra lý do và xác nhận DANG_XU_LY, **không gọi** `appointmentRepo.findOverlap` như `createAppointment` / `updateAppointment`. Lịch hẹn gắn với phiếu và "lịch của KTV" được tính qua `ticket.technician_id` nên đổi `technician_id` chuyển luôn lịch sang người mới mà không ai kiểm tra.
- Cách sửa : trong nhánh đổi KTV, với mỗi lịch `DA_DAT` của phiếu (`findByTicket`) gọi `findOverlap` theo KTV mới; trùng thì ném 409 `APPOINTMENT_OVERLAP` trước khi ghi gì, phiếu giữ nguyên người cũ. Thêm test hồi quy `tests/reassignOverlap.test.js` (4 test, gồm biên chạm đầu mút) và `tests/integration/reassign.overlap.test.js` (PostgreSQL thật).
- Commit và xác nhận : [`71305f5`](https://github.com/tanvu0202/smartcrm-mekong-mobile/commit/71305f5816319c403927e2039fdac84fa36893df) · TC-05 FAIL → PASS; khi bỏ bản sửa, 3 test hồi quy đỏ; `npm run test:full` 0 fail (ảnh `BUG-07-fixed.png`).

### BUG-08 – Major – ngày không tồn tại (30/02) bị âm thầm dời sang ngày khác
- Phát hiện bởi : test case TC-06 (kiểm thử khám phá, giá trị biên về ngày) – FAIL ở lượt chạy 1.
- Triệu chứng : `POST /tickets` với `dueDate = 2027-02-30T10:00:00Z` và `POST /tickets/{id}/appointments` với `startTime = <năm>-02-30…` trả **201**; dữ liệu lưu là **02/03** (`2027-03-02T10:00:00+00:00`). Lịch giao máy hoặc hạn cam kết bị sai ngày mà không ai được báo.
- Tái lập : `npm run tc -- TC-06`.
- Nguyên nhân : `ticketService.js`, hàm `validateTicketInput` (kiểm tra `dueDate`) và `validateAppointmentInput` (kiểm tra `startTime`, `endTime`) dùng `Date.parse`. Trong Node, `Date.parse('2027-02-30')` **không** trả `NaN` mà tự "cuộn" sang 02/03; ngoài ra `Date.parse(123)` cũng cho ra một ngày.
- Cách sửa : thêm hàm `parseInstant` chỉ nhận chuỗi ISO 8601 và kiểm tra ngày có thật (xét tháng 30/31 ngày, năm nhuận kể cả 2100 không nhuận và 2000 nhuận); hai hàm kiểm tra đầu vào dùng hàm này, sai thì 400. Test hồi quy `tests/dateValidation.test.js` (6 test).
- Commit và xác nhận : [`d646da6`](https://github.com/tanvu0202/smartcrm-mekong-mobile/commit/d646da65f4c2beb14fe10bf21897e73aea7e270d) · TC-06 FAIL → PASS; khi bỏ bản sửa, test hồi quy đỏ; `npm run test:full` 0 fail (ảnh `BUG-08-fixed.png`).

### BUG-09 – Minor – tên khách hàng chỉ gồm dấu cách được chấp nhận
- Phát hiện bởi : test case TC-07 – FAIL ở lượt chạy 1.
- Triệu chứng : `POST /tickets` với `customerName = "     "` trả **201** và lưu `customer_name = ""` (chuỗi rỗng) dù trường này bắt buộc (`NOT NULL`, nhưng rỗng vẫn qua được).
- Tái lập : `npm run tc -- TC-07`.
- Nguyên nhân : `ticketService.js`, hàm `validateTicketInput`, hàm con `need`: coi là thiếu chỉ khi giá trị `undefined`, `null` hoặc đúng `''`; chuỗi toàn dấu cách qua được rồi mới bị `trim()` ở bước trả về thành `''`.
- Cách sửa : `need` coi chuỗi chỉ gồm khoảng trắng là thiếu (`trim() === ''`) → 400 nêu rõ trường. Test hồi quy `tests/blankFields.test.js` (4 test, có biên tên 1 ký tự và tên có dấu cách hai đầu).
- Commit và xác nhận : [`d89e7a2`](https://github.com/tanvu0202/smartcrm-mekong-mobile/commit/d89e7a2d22c9cd8d898076b1d4157fcaaac3f8f5) · TC-07 FAIL → PASS; `npm run test:full` 0 fail (ảnh `BUG-09-fixed.png`).

### BUG-10 – Minor – số điện thoại "++++++++" được chấp nhận
- Phát hiện bởi : test case TC-08 – FAIL ở lượt chạy 1.
- Triệu chứng : `POST /tickets` với `customerPhone = "++++++++"` trả **201** và lưu nguyên chuỗi dấu cộng; tương tự `0912+345+678`.
- Tái lập : `npm run tc -- TC-08`.
- Nguyên nhân : `ticketService.js`, hàm `validateTicketInput`: biểu thức `/^[0-9+]{8,15}$/` cho phép dấu `+` ở **mọi** vị trí và không yêu cầu chữ số nào.
- Cách sửa : đổi thành `/^\+?[0-9]{8,15}$/` (tối đa một dấu `+` ở đầu rồi 8–15 chữ số). Test hồi quy `tests/phoneValidation.test.js` (4 test, biên 7/8 và 15/16 chữ số).
- Commit và xác nhận : [`e91e637`](https://github.com/tanvu0202/smartcrm-mekong-mobile/commit/e91e637cee31f44c458334fb219edb39725202e3) · TC-08 FAIL → PASS (`++++++++` → 400, `+84912345678` → 201); `npm run test:full` 0 fail (ảnh `BUG-10-fixed.png`).

### BUG-11 – Minor – chuỗi vượt độ dài cột làm API trả 500 thay vì 400
- Phát hiện bởi : test case TC-11 (giá trị biên 100/101 ký tự) – FAIL ở lượt chạy 1.
- Triệu chứng : tên khách 101 ký tự trả **500** `"Lỗi hệ thống"`; cùng cơ chế: tên thiết bị 101 ký tự và lý do đổi KTV 256 ký tự cũng trả 500. Người dùng không biết trường nào sai và nhật ký lỗi bị nhiễu.
- Tái lập : `npm run tc -- TC-11` (tên 100 ký tự → 201; 101 ký tự → 500).
- Nguyên nhân : `ticketService.js`, hàm `validateTicketInput` (tên, thiết bị) và `changeAssignment` (lý do) không kiểm tra độ dài so với kiểu cột trong `db/migrations/001_create_tables.sql` (`VARCHAR(100)`, `VARCHAR(255)`); PostgreSQL từ chối (`22001`) và `errorHandler` chỉ ánh xạ `22P02` và `23xxx`, các mã khác thành 500.
- Cách sửa : khai báo giới hạn theo cột (`LIMITS`) và kiểm tra ngay ở service (tên ≤ 100, thiết bị ≤ 100, lý do ≤ 255, tính sau khi cắt khoảng trắng) → 400 nêu rõ trường. Test hồi quy `tests/inputLimits.test.js` (4 test, biên hai phía).
- Commit và xác nhận : [`bb3a289`](https://github.com/tanvu0202/smartcrm-mekong-mobile/commit/bb3a2894f3ee31cc74981bd932fe9b6fbd04be05) · TC-11 FAIL → PASS (100 ký tự → 201, 101 ký tự → 400); `npm run test:full` 0 fail (ảnh `BUG-11-fixed.png`).

### BUG-12 – Major – CSDL chết thì API treo thay vì báo lỗi (tìm thấy bằng checklist bảo mật mục 5, 12/11/2026)
- Phát hiện bởi : `scripts/kiem-tra-bao-mat.sh` mục 5 – `docker compose stop db` rồi `curl /api/tickets` không có phản hồi (HTTP 000 sau 30 giây).
- Triệu chứng : khi container `db` dừng, mọi lời gọi cần CSDL đều treo đến hết thời gian của client; không có thông báo lỗi nào cho người dùng.
- Tái lập : dựng bằng `docker compose up -d --build`, đăng nhập, `docker compose stop db`, `curl -m 30 http://localhost:3000/api/tickets`.
- Nguyên nhân : `src/backend/src/config/index.js` không đặt `connectionTimeoutMillis` cho pool `pg` (mặc định chờ vô hạn); `src/backend/src/db.js` không bắt sự kiện `error` của pool (kết nối rỗi bị ngắt có thể làm sập tiến trình); `errorHandler.js` không phân biệt lỗi mất kết nối nên nếu có thì trả 500.
- Cách sửa : chờ kết nối tối đa 5 giây (`DB_CONNECT_TIMEOUT_MS`), bắt lỗi pool và ghi log mã lỗi, trả **503 `DB_UNAVAILABLE`** với thông báo chung. Test hồi quy `tests/dbUnavailable.test.js` (5 test: bốn kiểu lỗi mất kết nối và một lỗi bất ngờ vẫn là 500).
- Commit và xác nhận : `1b0da63` · chạy lại mục 5 trên Docker thật: dừng `db` → HTTP 503 `DB_UNAVAILABLE`, bật lại `db` thì hệ thống `(healthy)` trở lại.
