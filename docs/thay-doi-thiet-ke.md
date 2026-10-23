# Nhật ký thay đổi thiết kế

## Sau phản hồi Bài tập 1 (buổi 8, ngày 19/10/2026)

TD-01..TD-07 trả lời từng điểm trong phản hồi của giảng viên về BT1 (điểm cần khắc phục và gợi ý cho BT2). TD-08..TD-13 là thay đổi phát sinh khi hiện thực Sprint 1; TD-14..TD-16 phát sinh ở Sprint 2 (cuối tệp).

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

### TD-13 Cơ sở dữ liệu: PostgreSQL thay cho MongoDB Atlas đã ghi ở form đăng ký phạm vi (TH01)
- Phản hồi của GV : Không có (tự phát hiện khi đối chiếu TH01 với BT1).
- Quyết định      : GIỮ PostgreSQL (đã dùng từ BT1)
- Lý do           : Dữ liệu L4 có quan hệ chặt (ticket – technician – appointment – ticket_log), cần ràng buộc CHECK/khóa ngoại, transaction nhiều bảng (NFR05) và khóa dòng `SELECT … FOR UPDATE` để chống phân công đồng thời. Các ràng buộc này là cốt lõi của thiết kế BT1 và đã được kiểm chứng bằng test.
- Ảnh hưởng       : Stack ghi ở README mục 3 là PostgreSQL; DDL BT1 giữ nguyên; không có thành phần MongoDB trong mã nguồn.

## Thay đổi phát sinh khi hiện thực Sprint 2 (Buổi 10, ngày 23/10/2026)

### TD-14 Thêm đăng nhập tối thiểu theo vai trò (SRS 1.5 từng coi là ngoài phạm vi)
- Phản hồi của GV : Không có (tự phát hiện khi làm giao diện).
- Quyết định      : SỬA
- Lý do           : Đề Buổi 10 yêu cầu có đăng nhập và khi nhận 401 phải xóa token, về trang đăng nhập; M3 "Phiếu của tôi" cũng chỉ có nghĩa khi biết ai đang đăng nhập. SRS 1.5 giả định có "dịch vụ xác thực có sẵn" nhưng dịch vụ đó không tồn tại trong dự án, nên dựng bản thay thế nhỏ nhất. Không tạo bảng tài khoản: ba tài khoản demo (1 quản lý, 2 kỹ thuật viên) khai báo trong mã, mật khẩu băm scrypt khi khởi động; token HS256 ký bằng `node:crypto` (không thêm thư viện). Kỹ thuật viên liên kết với bản ghi `technician` qua số điện thoại.
- Ảnh hưởng       : ERD và DDL BT1 giữ nguyên. Thêm `POST /auth/login`, `GET /auth/me`; mọi endpoint khác cần `Authorization: Bearer`; 401 `UNAUTHENTICATED` / `TOKEN_EXPIRED` / `INVALID_CREDENTIALS`; 403 `FORBIDDEN`. Biến môi trường mới `AUTH_SECRET`, `DEMO_PASSWORD`, `TOKEN_TTL_SECONDS`, `CORS_ORIGIN`. SRS mục 1.1 và 1.5 thêm ghi chú trỏ về TD này. Giới hạn đã biết: không quản lý tài khoản, không đổi mật khẩu, không thu hồi token trước hạn.

### TD-15 Giao diện Sprint 2 bám wireframe BT1; chỉ cắt thông báo lịch hẹn cho khách
- Phản hồi của GV : Không có (tự phát hiện khi đối chiếu giao diện chạy thật với wireframe BT1 ngày 23/10/2026).
- Quyết định      : GIỮ NGUYÊN THIẾT KẾ, hiện thực cho khớp; CẮT một phần có ghi lý do
- Lý do           : Bản giao diện đầu tiên chỉ làm luồng phân công và bỏ lịch hẹn, cập nhật trạng thái, thẻ tổng quan để có một luồng chạy trọn sớm. Khi đối chiếu, giao diện khác wireframe ở nhiều chỗ và các màn hình thiếu phần chức năng đã vẽ, nên bổ sung để sản phẩm khớp thiết kế đã nộp ở BT1 thay vì sửa bản vẽ. Chỉ cắt thông báo SMS / email cho khách (FR07, US07) vì cần dịch vụ gửi tin bên ngoài mà dự án không có.
- Ảnh hưởng       :
  - Backend: thêm `POST /tickets/{id}/status` (chuỗi DA_PHAN_CONG → DANG_XU_LY → HOAN_TAT, nhảy bước trả 409 `STATUS_SKIP`; kỹ thuật viên chỉ đổi được phiếu của mình), `GET` và `POST /tickets/{id}/appointments` (quản lý), trường `appointment_start` ở danh sách phiếu. Ghi `ticket_log` (DOI_TRANG_THAI) trong cùng transaction.
  - QT-05 (trùng lịch): so khung giờ với các lịch `DA_DAT` của cùng kỹ thuật viên, hai lịch chỉ chạm đầu mút thì hợp lệ; khóa dòng kỹ thuật viên để hai lần đặt đồng thời không cùng qua (đã thử bằng hai phiên psql song song).
  - M1: ba thẻ tổng quan (phiếu phát sinh hôm nay; quá hạn hoặc còn ≤ 4 giờ; số phiếu đang mở của từng kỹ thuật viên), bộ lọc Trung tâm / Mức ưu tiên / Trạng thái kèm nút "Lọc", phân trang 20 dòng (NFR02).
  - M2: khối "Đặt lịch hẹn giao – nhận máy", hộp Có / Không khi kỹ thuật viên ≥ 10 phiếu (UC01 5a), thông báo 4a, 5a, 5b, trùng lịch như wireframe.
  - M3: cột "Lịch hẹn (bắt đầu)", nút "Bắt đầu xử lý" / "Hoàn tất", thông báo "Phải chuyển qua Đang xử lý trước".
  - Thêm so với wireframe (theo yêu cầu của tôi sau khi xem giao diện): trang Đăng nhập có ba nút tài khoản demo bấm là đăng nhập luôn (TD-14); M2 của phiếu đã phân công vẫn hiện bảng "Đề xuất kỹ thuật viên thay thế" (bỏ người đang phụ trách) làm nguồn chọn cho khối Đổi kỹ thuật viên.
  - Trạng thái rỗng đã rà cho mọi vùng dữ liệu: M1 (hết phiếu Mới; lọc không khớp), M2 (không có đề xuất; chưa có lịch hẹn; chưa có lịch sử; không có KTV thay thế phù hợp), M3 (kỹ thuật viên chưa có phiếu; quản lý chọn kỹ thuật viên chưa có phiếu).
  - Còn khác wireframe: không có thông báo SMS / email nên thông báo sau khi lưu lịch hẹn chỉ ghi "Đã lưu lịch hẹn."; thanh trên ghi vai trò và tên người đăng nhập, không ghi tên trung tâm vì tài khoản demo không gắn trung tâm; bộ lọc Trung tâm mặc định "Tất cả".

### TD-16 Bổ sung endpoint tra cứu, `changedBy` lấy từ token, kỹ thuật viên chỉ thấy phiếu của mình
- Phản hồi của GV : Không có.
- Quyết định      : SỬA
- Lý do           : (1) Bộ lọc trung tâm của M1 và hộp chọn thủ công của M2 (SRS US02, ngoại lệ "cho chọn thủ công trong trung tâm") cần danh sách trung tâm và kỹ thuật viên. (2) Khi đã có đăng nhập, để client tự gửi `changedBy` trong body thì ai cũng ghi lịch sử dưới tên người khác; NFR05 cần nhật ký đáng tin. (3) Chỉ ẩn nút trên giao diện thì không bảo vệ được dữ liệu, nên quyền được ép ở server.
- Ảnh hưởng       : Thêm `GET /centers`, `GET /technicians?center_id=` (chỉ quản lý). `ticket_log.changed_by` luôn lấy từ token; trường `changedBy` trong body bị bỏ qua. Kỹ thuật viên gọi `GET /tickets` chỉ nhận phiếu của chính mình (bộ lọc `technician_id` bị ghi đè), mở phiếu người khác trả 403; tạo / sửa / xóa / đề xuất / phân công / đổi KTV / lịch sử / lịch hẹn chỉ cho quản lý; đổi trạng thái do kỹ thuật viên chỉ áp dụng cho phiếu của chính họ. docs/api-contract.md cập nhật; có test ở tests/auth.test.js.

