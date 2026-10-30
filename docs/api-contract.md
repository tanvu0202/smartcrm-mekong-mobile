# Hợp đồng API – Sprint 1 và 2 (L4)

Base URL: `http://localhost:3000/api` · JSON UTF-8 · từ Sprint 2 mọi endpoint (trừ `/health`, `/auth/login`) cần header `Authorization: Bearer <token>` (TD-14).
Lỗi luôn có dạng `{ "error": { "code": "...", "message": "...", "details": [...] } }`.

| Method | Đường dẫn | Mục đích | Thành công | Lỗi chính |
|---|---|---|---|---|
| GET | /health | Kiểm tra server + DB | 200 | 503 |
| POST | /auth/login | Đăng nhập `{username, password}` → `{token, expiresIn, user:{username, fullName, role, technicianId}}` | 200 | 400, 401 `INVALID_CREDENTIALS` / `ACCOUNT_DISABLED` |
| GET | /auth/me | Người dùng của token hiện tại | 200 `{user}` | 401 |
| GET | /centers | *(quản lý)* Danh sách trung tâm cho bộ lọc M1 (TD-16) | 200 `{data:[{center_id,name}]}` | 401, 403 |
| GET | /technicians?center_id= | *(quản lý)* Danh sách kỹ thuật viên đang hoạt động (chọn thủ công, M3 theo KTV) | 200 `{data:[…]}` | 401, 403 |
| GET | /tickets?status=&center_id=&technician_id= | Danh sách phiếu (sắp theo ưu tiên, hạn cam kết) – UC01 bước 1 | 200 `{data:[…]}` | – |
| GET | /tickets/{id} | Chi tiết phiếu | 200 | 404 |
| POST | /tickets | *Hỗ trợ (TD-11)* tạo phiếu thử, trạng thái MOI | 201 | 400 |
| PUT | /tickets/{id} | *Hỗ trợ* sửa thông tin, chỉ khi MOI | 200 | 400, 404, 409 `TICKET_NOT_EDITABLE` |
| DELETE | /tickets/{id} | *Hỗ trợ* xóa phiếu MOI | 204 | 404, 409 `TICKET_NOT_DELETABLE` |
| GET | /tickets/{id}/suggestions | Đề xuất KTV: cùng trung tâm, tay nghề ≥ 3 (QT-03), kèm `open_tickets`, `overloaded` (QT-06) | 200 | 404 |
| POST | /tickets/{id}/assign | Phân công **lần đầu** (chỉ phiếu MOI → DA_PHAN_CONG) | 200 `{ticket, log, warnings}` | 400, 404, 409, 422 |
| POST | /tickets/{id}/reassign | **Đổi** KTV (QT-04): bắt buộc `reason`; phiếu DANG_XU_LY cần `confirm:true` | 200 `{ticket, log, warnings}` | 400, 404, 409, 422 |
| GET | /tickets/{id}/history | Lịch sử thay đổi từ `ticket_log` | 200 | 404 |
| POST | /tickets/{id}/status | Chuyển trạng thái `{status}`: DA_PHAN_CONG → DANG_XU_LY → HOAN_TAT (QT-01); ghi `ticket_log` (DOI_TRANG_THAI) | 200 `{ticket, log}` | 400, 403, 404, 409 `STATUS_SKIP` / `INVALID_TRANSITION` |
| GET | /tickets/{id}/appointments | *(quản lý)* Lịch hẹn của phiếu | 200 `{data:[{appointment_id, appointment_type, start_time, end_time}]}` | 404 |
| POST | /tickets/{id}/appointments | *(quản lý)* Đặt lịch hẹn `{type: GIAO\|NHAN, startTime, endTime}` (QT-05) | 201 `{data}` | 400, 404, 409 `APPOINTMENT_OVERLAP` / `TICKET_NOT_ASSIGNED` / `TICKET_CLOSED` |
| GET | /appointments/{id} | *(quản lý)* Chi tiết một lịch hẹn (kể cả lịch đã hủy) | 200 `{data}` | 400, 404 |
| PUT | /appointments/{id} | *(quản lý)* Sửa `{type, startTime, endTime}` của lịch `DA_DAT`; kiểm tra trùng giờ (QT-05) nhưng **bỏ qua chính lịch đang sửa** (TD-18) | 200 `{data}` | 400, 404, 409 `APPOINTMENT_CANCELLED` / `TICKET_CLOSED` / `APPOINTMENT_OVERLAP` |
| DELETE | /appointments/{id} | *(quản lý)* **Hủy** lịch hẹn: xóa mềm (`status = DA_HUY`, dòng được giữ lại, khung giờ được giải phóng) | 204 | 400, 404, 409 `APPOINTMENT_CANCELLED` |

## POST /tickets (body)
```json
{ "centerId": 1, "customerName": "Nguyễn Văn A", "customerPhone": "0912345678",
  "deviceModel": "iPhone 13", "issueGroup": "MAN_HINH", "priority": 1,
  "issueDescription": "Vỡ màn hình", "dueDate": "2026-10-25T10:00:00Z" }
```
`priority`: 1=CAO, 2=TRUNG_BINH, 3=THAP · `issueGroup`: MAN_HINH, PIN, SAC, LOA, CAMERA, PHAN_MEM, KHAC.

## POST /tickets/{id}/assign và /reassign (body)
```json
{ "technicianId": 3, "reason": "(bắt buộc khi reassign)", "confirm": true }
```
Người thực hiện (`ticket_log.changed_by`) lấy từ token, không nhận từ body (TD-16).
| HTTP | code | Khi nào | Quy tắc |
|---|---|---|---|
| 400 | VALIDATION_ERROR | thiếu technicianId; reassign không có reason | QT-04 |
| 404 | NOT_FOUND | phiếu không tồn tại | |
| 409 | TICKET_ALREADY_ASSIGNED | `assign` khi phiếu không còn MOI – gồm trường hợp **hai người phân công đồng thời**, người đến sau thua | QT-02, UC01 5b |
| 409 | TICKET_NOT_ASSIGNED | `reassign` khi phiếu chưa có KTV | QT-02 |
| 409 | ALREADY_ASSIGNED | gán lại đúng KTV hiện tại | QT-02 |
| 409 | CONFIRM_REQUIRED | `reassign` phiếu DANG_XU_LY mà thiếu `confirm:true` | QT-04, TD-10 |
| 409 | TICKET_CLOSED | phiếu HOAN_TAT (cả khi đổi KTV và khi đặt lịch hẹn) | QT-01 |
| 409 | STATUS_SKIP | `status` nhảy bước: DA_PHAN_CONG → HOAN_TAT, thông báo "Phải chuyển qua Đang xử lý trước" | QT-01, US05 |
| 409 | INVALID_TRANSITION | chuyển trạng thái không hợp lệ (lùi bước, trùng trạng thái) | QT-01 |
| 409 | APPOINTMENT_OVERLAP | kỹ thuật viên của phiếu đã có lịch `DA_DAT` chồng giờ (hai lịch chỉ chạm đầu mút thì hợp lệ) | QT-05, US04 |
| 409 | APPOINTMENT_CANCELLED | sửa hoặc hủy một lịch hẹn đã hủy trước đó | QT-05, TD-18 |
| 409 | TICKET_NOT_ASSIGNED | đặt lịch hẹn khi phiếu chưa có kỹ thuật viên | QT-05 |
| 422 | TECH_OTHER_CENTER / TECH_INVALID | KTV khác trung tâm / không tồn tại / ngừng hoạt động | QT-03 |

Phản hồi 200 có thể kèm `warnings:[{code:"TECH_OVERLOADED"}]` khi KTV đạt ≥ 10 phiếu mở sau lần gán này (QT-06 – chỉ cảnh báo). Đổi trạng thái phiếu và ghi `ticket_log` xảy ra trong **một transaction**, dòng phiếu được khóa bằng `SELECT … FOR UPDATE` nên các yêu cầu đồng thời xếp hàng (NFR05).

## Xác thực và phân quyền (Sprint 2)
| HTTP | code | Khi nào |
|---|---|---|
| 401 | UNAUTHENTICATED | thiếu header, sai dạng, token bị sửa / ký bằng bí mật khác |
| 401 | TOKEN_EXPIRED | token quá hạn (mặc định 8 giờ) – giao diện xóa token và về trang đăng nhập |
| 401 | INVALID_CREDENTIALS | sai tên đăng nhập hoặc mật khẩu (cùng một lỗi cho cả hai trường hợp) |
| 403 | FORBIDDEN | sai vai trò, hoặc kỹ thuật viên mở phiếu không phải của mình |

| Vai trò | Được phép |
|---|---|
| QUAN_LY | tất cả endpoint |
| KTV | `GET /tickets` (server chỉ trả phiếu của chính họ), `GET /tickets/{id}` (chỉ phiếu của mình), `POST /tickets/{id}/status` (chỉ phiếu của mình, ngược lại 403), `/auth/*` |

Danh sách phiếu trả mảng trong `{data}`; tên trường giữ snake_case (`ticket_id`, `due_date`…), giao diện chuyển sang camelCase ở một nơi duy nhất (`src/frontend/src/api/contract.js`). `log_id` là bigint nên là chuỗi.

`GET /tickets` trả thêm `appointment_start` (giờ bắt đầu sớm nhất trong các lịch `DA_DAT` của phiếu, hoặc `null`) cho cột "Lịch hẹn" của M3. Đặt lịch hẹn khóa dòng phiếu và dòng kỹ thuật viên (`SELECT … FOR UPDATE`) nên hai lần đặt cùng lúc cho một kỹ thuật viên xếp hàng và lần sau bị `APPOINTMENT_OVERLAP`.

*Chưa làm:* gửi thông báo SMS / email lịch hẹn cho khách (FR07, US07; xem README mục 6 và TD-15).
