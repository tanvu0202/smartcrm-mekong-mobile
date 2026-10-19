# Nhật ký thay đổi thiết kế

## Sau phản hồi Bài tập 1 (buổi 8, ngày 19/10/2026)

TD-01..TD-07 trả lời từng điểm trong phản hồi của giảng viên về BT1 (điểm cần khắc phục và gợi ý cho BT2). TD-08..TD-12 là thay đổi phát sinh khi hiện thực Sprint 1.

### TD-01 Giảm số User Story từ 9 xuống 7
- Phản hồi của GV : "Có 9 User Story, đề yêu cầu 5–7. Có thể gộp US08 (lọc) vào US01."
- Quyết định      : SỬA
- Lý do           : Đề yêu cầu 5–7 story. Gộp US08 vào US01 mới còn 8, vẫn vượt; nên gộp thêm US09 (cập nhật trạng thái) vào US05 vì cùng tác nhân Kỹ thuật viên và cùng màn hình M3. Giữ nguyên 9 FR và 9 use case để không mất yêu cầu nào.
- Ảnh hưởng       : docs/srs.md mục 1.3 (US01 phủ FR01+FR08; US05 phủ FR05+FR09; US06→US06, US07 giữ nguyên là thông báo khách) và bảng truy vết mục 1.6; docs/diagrams/wireframe.md và wireframe.drawio đổi nhãn "US09" thành "US05". Mã nguồn không đổi.

### TD-02 Sửa tên bài toán cho đúng luồng L4
- Phản hồi của GV : Trang 2 ghi "Tên bài toán: Hệ thống tiếp nhận và phân loại yêu cầu bảo hành" trong khi bài làm luồng L4.
- Quyết định      : SỬA
- Lý do           : Tiếp nhận và phân loại là luồng L2, đã nằm trong mục "Ngoài phạm vi"; tên bài toán phải khớp phạm vi thật.
- Ảnh hưởng       : Tên mới: "Hệ thống phân công kỹ thuật viên và lịch hẹn bảo hành, Mekong Mobile (luồng L4)" ở docs/srs.md, README.md, báo cáo Buổi 8. Tên đề tài đã đăng ký giữ nguyên ở hồ sơ hành chính.

### TD-03 Chốt QT-06, bỏ "chờ giảng viên xác nhận"
- Phản hồi của GV : QT-06 còn ghi "chờ giảng viên xác nhận".
- Quyết định      : SỬA
- Lý do           : Quy tắc nghiệp vụ phải kiểm thử được, không được để ngỏ. Chốt: cảnh báo khi kỹ thuật viên đã có ≥ 10 phiếu đang mở (status ≠ HOAN_TAT); chỉ cảnh báo, không chặn phân công.
- Ảnh hưởng       : docs/srs.md mục 1.5; luồng ngoại lệ 5a của UC01 và wireframe M2; mã nguồn `openTicketWarnThreshold = 10` và nhánh cảnh báo trong `ticketService`; có unit test ở 9 và 10 phiếu.

### TD-04 Phụ lục AI đủ cam kết, họ tên, MSSV, ngày; repo có ai-disclosure.md
- Phản hồi của GV : Phụ lục AI thiếu dòng cam kết, họ tên, MSSV, ngày; repo chưa có ai-disclosure.md.
- Quyết định      : SỬA
- Lý do           : Khai báo AI là minh chứng liêm chính học thuật, phải truy được về đúng người, đúng thời điểm và có cam kết.
- Ảnh hưởng       : Thêm docs/ai-disclosure.md (cam kết + Trần Tấn Vũ + 2374802010573 + 19/10/2026 + bảng công cụ); README mục 7 trỏ tới file; Phụ lục A của báo cáo Buổi 8 dùng cùng khuôn.

### TD-05 Trang bìa đủ lớp, ngày nộp, link GitHub; bố cục gọn
- Phản hồi của GV : Trang bìa nên có đủ lớp, ngày nộp và link GitHub; PDF 22 trang do nhiều khoảng trắng.
- Quyết định      : SỬA
- Lý do           : Giảng viên cần nhận diện bài và mở repo ngay từ trang bìa; nhiều khoảng trắng làm tài liệu khó đọc.
- Ảnh hưởng       : Báo cáo Buổi 8 (3 trang) dùng khuôn bìa mới và bố cục liền mạch; khuôn này dùng cho BT2. Trường "Lớp" cần điền đúng mã lớp trước khi nộp.

### TD-06 Thêm test cho câu truy vấn đề xuất kỹ thuật viên
- Phản hồi của GV : Gợi ý BT2: viết test cho câu truy vấn đề xuất kỹ thuật viên (cùng trung tâm, tay nghề ≥ 3).
- Quyết định      : SỬA
- Lý do           : Đây là câu SQL chứa quy tắc QT-03 và gắn với NFR01; mock repository không kiểm chứng được nên phải chạy trên PostgreSQL thật.
- Ảnh hưởng       : tests/integration/suggestions.query.test.js kiểm tra: cùng trung tâm, tay nghề đúng ngưỡng 3 được chọn, tay nghề 2 bị loại, sai nhóm sự cố bị loại, KTV ngừng hoạt động bị loại, khác trung tâm bị loại, thứ tự theo tay nghề, đếm phiếu mở, trường hợp rỗng.

### TD-07 Thêm test hai yêu cầu phân công đồng thời và sửa thiết kế API cho đúng ngoại lệ 5b
- Phản hồi của GV : Gợi ý BT2: viết test hai yêu cầu phân công đồng thời cho ngoại lệ (phiếu đã được người khác phân công).
- Quyết định      : SỬA
- Lý do           : Bản đầu gộp phân công và đổi KTV trong một endpoint, nên người đến sau bị hiểu nhầm là "đổi KTV" và nhận lỗi thiếu lý do thay vì báo phiếu đã được phân công. Tách thành `POST /tickets/{id}/assign` (chỉ phiếu MOI) và `POST /tickets/{id}/reassign` (bắt buộc lý do); dòng phiếu khóa bằng `SELECT … FOR UPDATE` nên hai yêu cầu xếp hàng.
- Ảnh hưởng       : tests/integration/assign.concurrency.test.js (1 thắng, 1 nhận 409 TICKET_ALREADY_ASSIGNED, ticket_log đúng 1 dòng; thêm ca hai yêu cầu đổi KTV đồng thời cho chuỗi log liền mạch); docs/api-contract.md; ticketService; ngoại lệ 5b UC01 nay có kiểm chứng. Đã thử bỏ khóa dòng: cả hai test đều báo lỗi.

## Thay đổi phát sinh khi hiện thực Sprint 1

### TD-08 Thêm sequence sinh mã phiếu
- Phản hồi của GV : Không có (tự phát hiện khi viết `POST /tickets`).
- Quyết định      : SỬA
- Lý do           : DDL của BT1 chỉ có `ticket_code UNIQUE`, chưa nói mã sinh thế nào; sinh ở tầng ứng dụng dễ trùng khi hai yêu cầu đến cùng lúc.
- Ảnh hưởng       : Thêm `ticket_code_seq` trong 001_create_tables.sql; mã dạng `BH-0001`; ERD không đổi.

### TD-09 Migration chạy lại được
- Phản hồi của GV : Không có.
- Quyết định      : SỬA
- Lý do           : Chạy migration hai lần không được lỗi hay nhân đôi dữ liệu.
- Ảnh hưởng       : DDL dùng `IF NOT EXISTS`; seed dùng `ON CONFLICT DO NOTHING`; thêm bảng kỹ thuật `schema_migrations` (không thuộc mô hình nghiệp vụ, không vẽ vào ERD).

### TD-10 Xác nhận đổi KTV của phiếu "Đang xử lý" truyền qua `confirm=true`
- Phản hồi của GV : Không có.
- Quyết định      : SỬA
- Lý do           : QT-04 yêu cầu "cần xác nhận"; ở giao diện là hộp thoại, ở API phải là tham số tường minh để server tự bảo vệ quy tắc, không tin giao diện.
- Ảnh hưởng       : `POST /tickets/{id}/reassign` có trường `confirm`; thiếu thì trả 409 `CONFIRM_REQUIRED`.

### TD-11 `POST /tickets` chỉ là CRUD nền, không phải tiếp nhận
- Phản hồi của GV : Không có.
- Quyết định      : GIỮ NGUYÊN phạm vi
- Lý do           : Entity chính của Sprint 1 là `ticket` nên cần đủ CRUD theo yêu cầu buổi 8, nhưng tiếp nhận và phân loại thuộc L2, ngoài phạm vi. Endpoint tạo phiếu chỉ để nhập dữ liệu thử cho L4.
- Ảnh hưởng       : README mục 1 vẫn ghi "Không làm: tiếp nhận (L2)"; api-contract.md đánh dấu các endpoint hỗ trợ.

### TD-12 Hoãn lịch hẹn (QT-05) sang Sprint 2
- Phản hồi của GV : Không có.
- Quyết định      : GIỮ NGUYÊN thiết kế, hoãn hiện thực
- Lý do           : Buổi 8 chỉ yêu cầu module đầu tiên chạy được; phân công là lõi của L4, đặt lịch phụ thuộc vào phân công.
- Ảnh hưởng       : Bảng `appointment` đã tạo bằng migration nhưng chưa có endpoint; ghi ở README mục 6.
