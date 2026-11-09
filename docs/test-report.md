# Test Report – Buổi 14 (Bài tập 3)

Hệ thống: Smart CRM Mekong Mobile, luồng L4 *Phân công kỹ thuật viên và lịch hẹn*. Mọi dòng dưới đây là kết quả chạy thật bằng `scripts/chay-test-case.js` vào backend + PostgreSQL trên máy của sinh viên; mỗi test case có ảnh chụp terminal trong `docs/screenshots/`.

- Lượt chạy 1 (trước khi sửa bug): 15:16:51 9/11/2026 – **7/12 PASS, 5 FAIL**
- Lượt chạy cuối (sau khi sửa bug): 15:45:53 9/11/2026 – **12/12 PASS, 0 FAIL**
- Cách chạy lại một test case: `npm run tc -- TC-05` · cả bộ: `npm run tc:all`

| Mã TC | Loại | Ưu tiên | Dữ liệu vào / bước | Kết quả mong đợi | Kết quả thực tế (lượt 1) | Trạng thái (lượt 1 → cuối) | Minh chứng / Bug |
|---|---|---|---|---|---|---|---|
| TC-01 | Luồng đúng | Cao | Luồng chính: tạo phiếu → phân công → xử lý → hoàn tất. Phiếu hợp lệ (priority 2, SĐT 10 số); KTV Hải xử lý phiếu của mình | Phiếu đi MOI → DA_PHAN_CONG → DANG_XU_LY → HOAN_TAT; lịch sử ghi đủ 3 dòng | HTTP 200/200, trạng thái cuối HOAN_TAT, lịch sử 3 dòng | PASS → PASS | [ảnh](screenshots/TC-01.png) |
| TC-02 | Luồng đúng | Cao | Đặt lịch hẹn giao máy cho phiếu đã phân công. Lịch GIAO 09:00–10:00 (giờ UTC 02:00–03:00) cho KTV Hải | 201, lịch ở trạng thái DA_DAT và xuất hiện trong danh sách lịch của phiếu | HTTP 201, status=DA_DAT, số lịch của phiếu=1 | PASS → PASS | [ảnh](screenshots/TC-02.png) |
| TC-03 | Biên (phía hợp lệ) | Cao | Biên QT-05: hai lịch chỉ chạm đầu mút (10:00 = 10:00) KHÔNG bị coi là trùng. Lịch A 02:00–03:00; lịch B 03:00–04:00 (cùng KTV) | Lịch B được tạo: 201 | HTTP 201 | PASS → PASS | [ảnh](screenshots/TC-03.png) |
| TC-04 | Biên (phía không hợp lệ) | Cao | Biên QT-05: lịch chồng lên lịch khác đúng 1 giây thì bị từ chối. Lịch A 02:00:00–03:00:00; lịch B 02:59:59–04:00:00 (cùng KTV) | 409 APPOINTMENT_OVERLAP | HTTP 409, code=APPOINTMENT_OVERLAP | PASS → PASS | [ảnh](screenshots/TC-04.png) |
| TC-05 | Luồng đúng / nghiệp vụ QT-05 | Cao | Đổi kỹ thuật viên sang người đã có lịch trùng giờ phải bị từ chối. Phiếu A (KTV Hải) lịch 02:00–03:00; phiếu B (KTV Long) cũng lịch 02:00–03:00; đổi phiếu A sang Long | 409 APPOINTMENT_OVERLAP và phiếu A vẫn thuộc KTV Hải | HTTP 200, code=(không có lỗi), KTV của phiếu A sau đó = Long (đã bị đổi!) | FAIL → PASS | [ảnh](screenshots/TC-05.png) · BUG-07 ([ảnh sau sửa](screenshots/BUG-07-fixed.png)) |
| TC-06 | Dữ liệu sai | Cao | Ngày không tồn tại (30/02) phải bị từ chối, không được tự đổi sang ngày khác. dueDate = 2027-02-30T10:00:00Z; startTime/endTime của lịch = <năm>-02-30 | Cả hai yêu cầu trả 400 VALIDATION_ERROR | HTTP 201 / 201 – phiếu được tạo, dueDate lưu thành 2027-03-02T10:00:00.000Z; lịch được tạo, start lưu thành 2158-03-02T02:00:00.000Z | FAIL → PASS | [ảnh](screenshots/TC-06.png) · BUG-08 ([ảnh sau sửa](screenshots/BUG-08-fixed.png)) |
| TC-07 | Dữ liệu sai | Trung bình | Tên khách hàng chỉ gồm dấu cách phải bị từ chối. customerName = "     " (5 dấu cách) | 400 VALIDATION_ERROR | HTTP 201 đã lưu customer_name="" | FAIL → PASS | [ảnh](screenshots/TC-07.png) · BUG-09 ([ảnh sau sửa](screenshots/BUG-09-fixed.png)) |
| TC-08 | Dữ liệu sai / biên | Trung bình | Số điện thoại: "++++++++" bị từ chối, "+84912345678" được chấp nhận. customerPhone = "++++++++" (8 ký tự) và "+84912345678" | Yêu cầu 1 → 400; yêu cầu 2 → 201 | "++++++++" → HTTP 201; "+84912345678" → HTTP 201 | FAIL → PASS | [ảnh](screenshots/TC-08.png) · BUG-10 ([ảnh sau sửa](screenshots/BUG-10-fixed.png)) |
| TC-09 | Bảo mật (phân quyền) | Cao | Không đăng nhập / sai vai trò đều bị chặn. Không token; KTV Hải xem phiếu của KTV Long; KTV Hải thử phân công; KTV Hải đổi trạng thái phiếu người khác | 401, 403, 403, 403 | HTTP 401, 403, 403, 403 | PASS → PASS | [ảnh](screenshots/TC-09.png) |
| TC-10 | Bảo mật / chất lượng dữ liệu | Cao | Chuỗi kiểu SQL injection được lưu nguyên văn, bảng không bị ảnh hưởng. customerName = "Robert'); DROP TABLE ticket;--" | 201; đọc lại đúng nguyên văn; danh sách phiếu vẫn truy vấn được | HTTP 201, lưu đúng nguyên văn=true, danh sách HTTP 200 | PASS → PASS | [ảnh](screenshots/TC-10.png) |
| TC-11 | Biên (2 phía) | Trung bình | Độ dài tên khách hàng: 100 ký tự được chấp nhận, 101 ký tự bị từ chối (cột VARCHAR(100)). customerName 100 ký tự, rồi 101 ký tự | 100 ký tự → 201; 101 ký tự → 400 VALIDATION_ERROR (không phải 500) | 100 ký tự → HTTP 201; 101 ký tự → HTTP 500 INTERNAL | FAIL → PASS | [ảnh](screenshots/TC-11.png) · BUG-11 ([ảnh sau sửa](screenshots/BUG-11-fixed.png)) |
| TC-12 | Tái lập | Trung bình | Chạy lại migration và seed lần 2 không nhân đôi dữ liệu. npm run migrate (lần 2) rồi chạy lại 002_seed_catalog.sql; so số dòng trước/sau | Migration báo "bỏ qua" cả 3 file, thoát mã 0; số dòng các bảng danh mục không đổi | migrate: 3 file "bỏ qua", mã thoát 0; số dòng không đổi | PASS → PASS | [ảnh](screenshots/TC-12.png) |

## Tổng hợp theo loại

| Loại | Số case | PASS lượt 1 | PASS lượt cuối |
|---|---|---|---|
| Luồng đúng | 3 | 2 | 3 |
| Biên | 3 | 2 | 3 |
| Dữ liệu sai | 3 | 0 | 3 |
| Bảo mật | 2 | 2 | 2 |
| Tái lập | 1 | 1 | 1 |

## Ghi chú

- Các lỗi tìm thấy khi chạy được ghi ở `docs/bug-log.md` (BUG-06 … BUG-11), mỗi lỗi sửa trong một commit riêng và có test hồi quy.
- Mỗi test case tự tạo dữ liệu riêng (tên "TC khach …", lịch hẹn vào năm 2100–2249) nên chạy lại nhiều lần không đụng nhau; phiếu thử còn lại trong CSDL không ảnh hưởng dữ liệu danh mục.
- Trạng thái FAIL ở lượt 1 là kết quả thật, giữ nguyên để truy vết; chúng chuyển PASS sau commit sửa tương ứng.
