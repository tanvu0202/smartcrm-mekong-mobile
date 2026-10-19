# Frontend (React) – chưa hiện thực ở Sprint 1

Cấu trúc đã dựng để ánh xạ lớp L1 của sơ đồ kiến trúc; mỗi trang tương ứng một wireframe trong BT1:

| File | Màn hình | Gọi API |
|---|---|---|
| `src/pages/TicketQueuePage.jsx` | M1 – Danh sách phiếu chờ phân công | `GET /tickets?status=MOI` |
| `src/pages/AssignPage.jsx` | M2 – Phân công và đặt lịch hẹn | `GET /tickets/{id}/suggestions`, `POST /tickets/{id}/assign` |
| `src/pages/MyTicketsPage.jsx` | M3 – Phiếu của kỹ thuật viên | `GET /tickets?technician_id=` |

Sẽ làm ở các buổi sau (buổi 9: frontend gọi API).
