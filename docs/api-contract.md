# API Contract – L4. Phân công kỹ thuật viên và lịch hẹn

**Sinh viên:** Trần Tấn Vũ – 2374802010573  
**Track:** SE  
**Phiên bản:** 1.0

---

## 1. Danh sách Endpoint (cho các story MUST)

| Method | Endpoint                            | Mục đích                     | User Story  |
| ------ | ----------------------------------- | ---------------------------- | ----------- |
| GET    | /api/tickets/{ticketId}/suggestions | Gợi ý kỹ thuật viên phù hợp  | US1 / FR-01 |
| POST   | /api/tickets/{ticketId}/assign      | Phân công kỹ thuật viên      | US2 / FR-02 |
| POST   | /api/tickets/{ticketId}/reassign    | Phân công lại kỹ thuật viên  | US7 / FR-03 |
| POST   | /api/appointments                   | Tạo lịch hẹn giao – nhận máy | US3 / FR-04 |
| GET    | /api/appointments/check-conflict    | Kiểm tra trùng lịch          | US3 / FR-05 |

---

## 2. Chi tiết từng Endpoint

### 2.1 GET /api/tickets/{ticketId}/suggestions

**Mục đích:** Trả về danh sách kỹ thuật viên đủ điều kiện cho phiếu.

**Request:** Không có body

**Response thành công (200):**

{
"ticketId": 1052,
"suggestions": [
{
"technicianId": 12,
"fullName": "Nguyễn Văn Dũng",
"skillLevel": 3,
"openTickets": 4,
"serviceArea": "Quận 10"
},
{
"technicianId": 18,
"fullName": "Trần Minh Khoa",
"skillLevel": 2,
"openTickets": 6,
"serviceArea": "Quận 10"
}
]
}

**Mã lỗi:**

- 404: Không tìm thấy phiếu
- 400: Phiếu không ở trạng thái Chờ phân công

---

### 2.2 POST /api/tickets/{ticketId}/assign

**Mục đích:** Gán kỹ thuật viên cho phiếu.

**Request body:**

{
"technicianId": 12,
"note": "Phân công theo đề xuất hệ thống"
}

**Response thành công (200):**

{
"ticketId": 1052,
"status": "ASSIGNED",
"technicianId": 12,
"assignedAt": "2026-10-02T14:30:00",
"assignedBy": "manager01"
}

**Mã lỗi:**

- 400: Dữ liệu không hợp lệ
- 404: Không tìm thấy phiếu hoặc kỹ thuật viên
- 409: Kỹ thuật viên đã đủ tải (≥ 8 phiếu) hoặc không đủ điều kiện

---

### 2.3 POST /api/tickets/{ticketId}/reassign

**Mục đích:** Đổi kỹ thuật viên đang phụ trách phiếu.

**Request body:**

{
"newTechnicianId": 18,
"reason": "Kỹ thuật viên cũ nghỉ phép"
}

**Response thành công (200):**

{
"ticketId": 1052,
"oldTechnicianId": 12,
"newTechnicianId": 18,
"reason": "Kỹ thuật viên cũ nghỉ phép",
"reassignedAt": "2026-10-02T15:10:00"
}

**Mã lỗi:**

- 400: Thiếu lý do
- 409: Kỹ thuật viên mới không đủ điều kiện hoặc bị trùng lịch

---

### 2.4 POST /api/appointments

**Mục đích:** Tạo lịch hẹn giao hoặc nhận máy.

**Request body:**

{
"ticketId": 1052,
"type": "PICK_UP",
"startAt": "2026-10-05T09:00:00",
"endAt": "2026-10-05T09:30:00",
"note": "Khách nhận máy vào buổi sáng"
}

**Response thành công (201):**

{
"appointmentId": 301,
"ticketId": 1052,
"technicianId": 12,
"type": "PICK_UP",
"startAt": "2026-10-05T09:00:00",
"endAt": "2026-10-05T09:30:00",
"status": "PENDING_CONFIRMATION"
}

**Mã lỗi:**

- 400: Thời gian không hợp lệ (ngoài giờ làm việc hoặc trong quá khứ)
- 409: Trùng lịch với lịch hẹn khác của cùng kỹ thuật viên

---

### 2.5 GET /api/appointments/check-conflict

**Mục đích:** Kiểm tra trùng lịch trước khi tạo.

**Query params:**  
technicianId=12&startAt=2026-10-05T09:00:00&endAt=2026-10-05T09:30:00

**Response thành công (200):**

{
"hasConflict": false,
"conflicts": []
}

**Khi có trùng (200):**

{
"hasConflict": true,
"conflicts": [
{
"appointmentId": 288,
"startAt": "2026-10-05T08:45:00",
"endAt": "2026-10-05T09:15:00"
}
]
}

---

## 3. Bảng Validation các trường quan trọng

| Trường         | Bắt buộc          | Kiểu dữ liệu | Ràng buộc                                                 |
| -------------- | ----------------- | ------------ | --------------------------------------------------------- |
| technicianId   | Có                | number       | Phải tồn tại và đang active                               |
| ticketId       | Có                | number       | Phải ở trạng thái phù hợp                                 |
| reason         | Có (khi reassign) | string       | Độ dài 5–255 ký tự                                        |
| type           | Có                | string       | Chỉ nhận DROP_OFF hoặc PICK_UP                            |
| startAt, endAt | Có                | datetime     | Trong tương lai, trong khung 08:00–17:30, endAt > startAt |
| note           | Không             | string       | Tối đa 500 ký tự                                          |

---

## 4. Quy ước chung

- Tất cả API yêu cầu header: Authorization: Bearer <token>
- Content-Type: application/json
- Thời gian trả về theo ISO 8601 (UTC+7)
