# Wireframe – Hệ thống phân công kỹ thuật viên và lịch hẹn bảo hành (Mekong Mobile)

**Sinh viên:** Trần Tấn Vũ – MSSV: 2374802010573 · **Track:** SE · **Luồng:** L4 – Phân công kỹ thuật viên và lịch hẹn

File thiết kế gốc: [`wireframe.drawio`](wireframe.drawio) (3 trang: M1, M2, M3). Ảnh xuất để chèn PDF đặt trong `docs/export/`.

## 1. Danh sách màn hình

| Màn hình | Vai trò | Tên màn hình | FR phục vụ |
|---|---|---|---|
| M1 | Quản lý trung tâm | Danh sách phiếu chờ phân công (kèm tổng quan và bộ lọc) | FR01, FR06, FR08 |
| M2 | Quản lý trung tâm | Phân công kỹ thuật viên và đặt lịch hẹn | FR02, FR03, FR04, FR07 |
| M3 | Kỹ thuật viên | Phiếu của tôi | FR05, FR09 |

## 2. Đối chiếu trường hiển thị với mô hình dữ liệu (phép kiểm 4)

| Màn hình | Trường hiển thị | Bảng.cột |
|---|---|---|
| M1 | Mã phiếu · Khách hàng · Thiết bị · Nhóm sự cố · Mức ưu tiên · Hạn cam kết · Trạng thái | `ticket.ticket_code` · `customer_name` · `device_model` · `issue_group` · `priority` · `due_date` · `status` |
| M1 | Bộ lọc Trung tâm / Mức ưu tiên / Trạng thái | `service_center.name` · `ticket.priority` · `ticket.status` |
| M1 | Phiếu phát sinh hôm nay; phiếu quá hạn hoặc còn ≤ 4 giờ | Tính từ `ticket.created_at`; `ticket.due_date` + `ticket.status` (không lưu) |
| M1 | Số phiếu đang mở của từng kỹ thuật viên | `technician.full_name` + COUNT(`ticket` theo `technician_id`, `status` ≠ HOAN_TAT) (không lưu) |
| M2 | Mã phiếu, khách hàng + số điện thoại, thiết bị, nhóm sự cố, mô tả, ưu tiên, hạn, trạng thái | `ticket.ticket_code` · `customer_name` · `customer_phone` · `device_model` · `issue_group` · `issue_description` · `priority` · `due_date` · `status` |
| M2 | Kỹ thuật viên hiện tại / đề xuất; Tay nghề | `technician.full_name` (qua `ticket.technician_id`) · `technician_skill.proficiency` |
| M2 | Lý do đổi | `ticket_log.reason` |
| M2 | Lịch hẹn: loại, ngày, bắt đầu, kết thúc | `appointment.appointment_type` · `start_time` · `end_time` |
| M3 | Mã phiếu · Thiết bị · Mô tả sự cố · Hạn cam kết · Trạng thái | `ticket.ticket_code` · `device_model` · `issue_description` · `due_date` · `status` |
| M3 | Lịch hẹn (bắt đầu) | `appointment.start_time` |

Ngược lại, mọi bảng đều xuất hiện ở ít nhất một màn hình: `service_center`, `technician`, `technician_skill`, `ticket`, `appointment` (M1–M3) và `ticket_log` (M2 – nhập lý do; lịch sử xem qua truy vấn kiểm toán).

## 3. Đối chiếu luồng ngoại lệ với giao diện (phép kiểm 6)

| Luồng ngoại lệ | Vị trí trên wireframe |
|---|---|
| UC01 · 2a – Không có phiếu "Mới" | M1: trạng thái rỗng "Không có phiếu chờ phân công" |
| UC01 · 4a – Không có kỹ thuật viên phù hợp | M2: thông báo + nút "Phân công thủ công" |
| UC01 · 5a – Kỹ thuật viên ≥ 10 phiếu | M2: hộp cảnh báo với nút "Có" / "Không" |
| UC01 · 5b – Phiếu đã được phân công | M2: thông báo "Phiếu đã được phân công" |
| US03 – Đổi kỹ thuật viên thiếu lý do / phiếu "Đang xử lý" | M2: "Vui lòng nhập lý do đổi kỹ thuật viên" và hộp xác nhận |
| US04 – Trùng lịch | M2: thông báo trùng lịch dưới nút "Đặt lịch hẹn" |
| US05 – Chưa có phiếu được giao | M3: "Bạn chưa có phiếu được giao" |
| US09 – Nhảy bước trạng thái | M3: "Phải chuyển qua Đang xử lý trước" |

## 4. Quy ước hiển thị

- Thẻ đỏ góc trên phải ô thông báo = mã luồng ngoại lệ tương ứng.
- Ô đỏ = lỗi/từ chối; ô vàng = cảnh báo cần xác nhận; ô xanh = thành công.
- Mức ưu tiên hiển thị CAO / TRUNG_BINH / THẤP (lưu số 1/2/3 ở `ticket.priority`).
