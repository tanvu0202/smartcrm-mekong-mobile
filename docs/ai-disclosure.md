# Khai báo sử dụng công cụ AI – Buổi 8

**Họ và tên:** Trần Tấn Vũ  
**Mã số sinh viên:** 2374802010573  
**Ngày thực hiện:** 19/10/2026

**Cam kết:** Tôi đã đọc, kiểm tra và chịu trách nhiệm về toàn bộ nội dung nộp. Các công cụ AI được dùng nêu đầy đủ trong bảng dưới đây; phần không khai báo là do tôi tự thực hiện.

| Công cụ | Phần áp dụng | Cách dùng (tóm tắt yêu cầu đã gửi) | Tôi đã chỉnh sửa / kiểm chứng gì |
|---|---|---|---|
| Trợ lý AI dạng chat (Claude) | `src/backend` (routes, controller, service, repository), `db/migrations/` | Yêu cầu dựng khung mã nguồn bốn lớp theo sơ đồ kiến trúc BT1 và hiện thực CRUD phiếu, đề xuất và phân công kỹ thuật viên theo QT-01..06 | Đọc lại từng lớp, đối chiếu quy tắc với SRS; chạy `npm install`, `npm run migrate`, `npm test`; gọi API bằng curl/Postman và chụp ảnh |
| Trợ lý AI dạng chat (Claude) | `tests/` (unit test, test truy vấn đề xuất KTV, test phân công đồng thời) | Yêu cầu viết test theo gợi ý của giảng viên | Chạy lại các test trên PostgreSQL của tôi; thử bỏ khóa dòng để xác nhận test đồng thời thật sự báo lỗi |
| Trợ lý AI dạng chat (Claude) | `docs/thay-doi-thiet-ke.md`, `docs/srs.md`, `docs/api-contract.md`, README | Yêu cầu soạn nhật ký TD theo mẫu bốn dòng, gộp User Story còn 7, soạn hợp đồng API từ mã nguồn | Đối chiếu từng TD với nhận xét gốc của giảng viên; kiểm tra bảng truy vết FR–US–UC không còn ô trống |
| Không dùng AI | Nội dung nhận xét của giảng viên, quyết định SỬA/GIỮ, ảnh chụp kết quả chạy | – | Do tôi tự thực hiện |
