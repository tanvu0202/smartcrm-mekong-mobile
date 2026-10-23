# Khai báo sử dụng công cụ AI – Buổi 8 và Buổi 10

**Họ và tên:** Trần Tấn Vũ  
**Mã số sinh viên:** 2374802010573  
**Ngày thực hiện:** 19/10/2026 (Buổi 8) và 23/10/2026 (Buổi 10)

**Cam kết:** Tôi đã đọc, kiểm tra và chịu trách nhiệm về toàn bộ nội dung nộp. Các công cụ AI được dùng nêu đầy đủ trong bảng dưới đây; phần không khai báo là do tôi tự thực hiện.

| Công cụ | Phần áp dụng | Cách dùng (tóm tắt yêu cầu đã gửi) | Tôi đã chỉnh sửa / kiểm chứng gì |
|---|---|---|---|
| Trợ lý AI dạng chat (Claude) | `src/backend` (routes, controller, service, repository), `db/migrations/` | Yêu cầu dựng khung mã nguồn bốn lớp theo sơ đồ kiến trúc BT1 và hiện thực CRUD phiếu, đề xuất và phân công kỹ thuật viên theo QT-01..06 | Đọc lại từng lớp, đối chiếu quy tắc với SRS; chạy `npm install`, `npm run migrate`, `npm test`; gọi API bằng curl/Postman và chụp ảnh |
| Trợ lý AI dạng chat (Claude) | `tests/` (unit test, test truy vấn đề xuất KTV, test phân công đồng thời) | Yêu cầu viết test theo gợi ý của giảng viên | Chạy lại các test trên PostgreSQL của tôi; thử bỏ khóa dòng để xác nhận test đồng thời thật sự báo lỗi |
| Trợ lý AI dạng chat (Claude) | `docs/thay-doi-thiet-ke.md`, `docs/srs.md`, `docs/api-contract.md`, README | Yêu cầu soạn nhật ký TD theo mẫu bốn dòng, gộp User Story còn 7, soạn hợp đồng API từ mã nguồn | Đối chiếu từng TD với nhận xét gốc của giảng viên; kiểm tra bảng truy vết FR–US–UC không còn ô trống |
| Trợ lý AI dạng chat (Claude) | `src/backend/src/auth/`, `middleware/`, `services/authService.js`, `controllers/`, `routes/` (đăng nhập, phân quyền, endpoint `/centers`, `/technicians`), `scripts/create-db.js` | Yêu cầu thêm đăng nhập tối thiểu theo vai trò, ép quyền ở server, lấy `changedBy` từ token, script tạo database không cần psql | Đọc lại từng tệp; gọi thử bằng curl với token quản lý, token kỹ thuật viên và không token (200 / 401 / 403); chạy `npm run db:create` |
| Trợ lý AI dạng chat (Claude) | `src/frontend/` (Vite + React: Đăng nhập, M1, M2, M3, `DataState`, `api/client.js`) | Yêu cầu dựng giao diện theo wireframe BT1, gọi API thật, xử lý ba trạng thái tải / lỗi / rỗng và 401 | Chạy giao diện trên trình duyệt với backend và PostgreSQL thật; thử dừng backend, tìm `fetch(` trong `pages/`; đối chiếu màn hình với wireframe |
| Trợ lý AI dạng chat (Claude) | `tests/auth.test.js`, `tests/frontend/` (39 test mới) | Yêu cầu viết test cho dữ liệu hợp lệ, biên và không hợp lệ | Chạy `npm test` (pass 54, tích hợp pass 58); đọc lại các ca biên |
| Trợ lý AI dạng chat (Claude) | `README.md` mục 3, `scripts/thu-clone-moi.sh`, `docs/thay-doi-thiet-ke.md` (TD-14..16), `docs/api-contract.md` | Yêu cầu soạn các bước dựng hệ thống, script thử clone mới, ghi phạm vi bị cắt và lý do | Tự chạy lại từng bước trên thư mục clone mới và ghi kết quả vào `docs/ket-qua-chay/` |
| Không dùng AI | Nội dung nhận xét của giảng viên, quyết định SỬA/GIỮ, ảnh chụp kết quả chạy | – | Do tôi tự thực hiện |
