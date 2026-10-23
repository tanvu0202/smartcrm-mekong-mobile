# SRS rút gọn – Hệ thống phân công kỹ thuật viên và lịch hẹn bảo hành, Mekong Mobile (luồng L4)

**Tên bài toán:** Phân công kỹ thuật viên và lịch hẹn cho phiếu bảo hành tại Mekong Mobile (luồng L4 của Smart CRM). Tiếp nhận và phân loại yêu cầu là luồng L2, nằm ngoài phạm vi tài liệu này.

> Trích từ Mục 1 của Bài tập 1 (bản đã chỉnh theo phản hồi GV – xem docs/thay-doi-thiet-ke.md, TD-01 và TD-02). Mục 2–5 (use case, kiến trúc, ERD, wireframe) nằm trong báo cáo BT1 và docs/diagrams/.



## **1.1. Giới thiệu, phạm vi và bảng thuật ngữ**

Mục đích: đặc tả yêu cầu cho luồng L4 – phân công kỹ thuật viên và đặt lịch hẹn cho phiếu bảo hành tại Mekong Mobile. Luồng bắt đầu từ phiếu ở trạng thái "Mới" → quản lý phân công kỹ thuật viên phù hợp → đặt lịch hẹn giao/nhận máy (khách nhận thông báo) → kỹ thuật viên nhận phiếu và cập nhật trạng thái đến khi hoàn tất.

**Trong phạm vi:** xem phiếu chờ phân công; đề xuất, phân công và đổi kỹ thuật viên; đặt lịch hẹn; thông báo lịch hẹn; xem phiếu được giao; cập nhật trạng thái; tổng quan khối lượng; lọc phiếu. **Ngoài phạm vi:** tiếp nhận và phân loại yêu cầu (L2); quản lý kho linh kiện (L5); khảo sát hài lòng (L8); báo cáo doanh thu, phân loại bằng AI (L10); thanh toán; quản lý tài khoản (đăng nhập tối thiểu theo vai trò đã được thêm ở Sprint 2 – xem TD-14 trong docs/thay-doi-thiet-ke.md).

**Bảng thuật ngữ – mỗi khái niệm chỉ dùng MỘT tên trong SRS, sơ đồ kiến trúc, ERD và wireframe:**

| **Thuật ngữ (hiển thị)** | **Tên kỹ thuật (bảng/cột)**  | **Định nghĩa**                                                                                        |
|--------------------------|------------------------------|-------------------------------------------------------------------------------------------------------|
| Phiếu bảo hành           | ticket                       | Yêu cầu bảo hành của khách, đi qua các trạng thái Mới → Đã phân công → Đang xử lý → Hoàn tất.         |
| Kỹ thuật viên            | technician                   | Nhân viên của một trung tâm, xử lý phiếu được giao.                                                   |
| Trung tâm bảo hành       | service_center               | Đơn vị bảo hành; kỹ thuật viên và phiếu đều thuộc đúng một trung tâm.                                 |
| Tay nghề                 | technician_skill.proficiency | Mức thành thạo (1–5) của kỹ thuật viên theo từng nhóm sự cố.                                          |
| Nhóm sự cố               | issue_group                  | Nhóm lỗi của thiết bị (ví dụ Màn hình, Pin, Sạc, Loa).                                                |
| Lịch hẹn                 | appointment                  | Khung giờ giao hoặc nhận máy giữa khách và kỹ thuật viên.                                             |
| Hạn cam kết              | due_date                     | Thời hạn trung tâm cam kết hoàn tất phiếu.                                                            |
| Mức ưu tiên              | priority                     | CAO (1), TRUNG_BINH (2) hoặc THẤP (3); lưu số 1–3 để sắp xếp đúng thứ tự.                             |
| Trạng thái phiếu         | status                       | Giai đoạn hiện tại của phiếu trong vòng đời (MOI, DA_PHAN_CONG, DANG_XU_LY, HOAN_TAT).                |
| Lịch sử thay đổi         | ticket_log                   | Bản ghi mỗi lần phân công, đổi kỹ thuật viên hoặc đổi trạng thái (thời gian, người thực hiện, lý do). |

## **1.2. Các bên liên quan và vai trò người dùng**

| **Bên liên quan**              | **Loại**             | **Vai trò / mối quan tâm**                                                                                                         |
|--------------------------------|----------------------|------------------------------------------------------------------------------------------------------------------------------------|
| Quản lý trung tâm              | Người dùng chính     | Xem phiếu chờ, phân công và đổi kỹ thuật viên, đặt lịch hẹn, xem tổng quan, lọc phiếu; cần phân công nhanh, công bằng, có lịch sử. |
| Kỹ thuật viên                  | Người dùng           | Xem phiếu được giao theo hạn cam kết, cập nhật trạng thái; cần biết phiếu nào phải làm trước.                                      |
| Khách hàng                     | Người nhận thông báo | Nhận thông báo khi lịch hẹn được đặt hoặc thay đổi; không đăng nhập hệ thống.                                                      |
| Hệ thống thông báo (SMS/email) | Hệ thống ngoài       | Gửi thông báo lịch hẹn tới khách hàng.                                                                                             |
| Ban điều hành Mekong Mobile    | Bên tài trợ          | Mong đạt hạn cam kết bảo hành và khối lượng công việc cân bằng giữa kỹ thuật viên.                                                 |

## **1.3. Yêu cầu chức năng (FR) và User Story**

| **Mã** | **Yêu cầu chức năng**                                                      | **MoSCoW** |
|--------|----------------------------------------------------------------------------|------------|
| FR01   | Xem danh sách phiếu chờ phân công, sắp xếp theo mức ưu tiên và hạn cam kết | MUST       |
| FR02   | Đề xuất và phân công kỹ thuật viên cho phiếu                               | MUST       |
| FR03   | Đổi kỹ thuật viên, bắt buộc nhập lý do và ghi lịch sử thay đổi             | MUST       |
| FR04   | Đặt lịch hẹn giao nhận máy và kiểm tra trùng lịch                          | SHOULD     |
| FR05   | Kỹ thuật viên xem danh sách phiếu được giao                                | SHOULD     |
| FR06   | Xem tổng quan khối lượng công việc                                         | SHOULD     |
| FR07   | Gửi thông báo cho khách khi lịch hẹn được đặt hoặc thay đổi                | COULD      |
| FR08   | Lọc danh sách phiếu theo trung tâm, mức ưu tiên, trạng thái                | COULD      |
| FR09   | Cập nhật trạng thái phiếu theo vòng đời                                    | SHOULD     |

**User Story (7 story: 6 story MUST/SHOULD đủ tiêu chí Given–When–Then; 1 story COULD ghi tóm tắt). Tiêu chí ngoại lệ đánh dấu (NL). FR08 (lọc) gộp vào US01; FR09 (cập nhật trạng thái) gộp vào US05 – xem TD-01:**

<table>
<colgroup>
<col style="width: 10%" />
<col style="width: 24%" />
<col style="width: 13%" />
<col style="width: 51%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Mã</strong></th>
<th><strong>User Story</strong></th>
<th><strong>MoSCoW</strong></th>
<th><strong>Tiêu chí chấp nhận (Given – When – Then)</strong></th>
</tr>
</thead>
<tbody>
<tr class="even">
<td>US01</td>
<td>Là Quản lý trung tâm, tôi muốn xem danh sách phiếu đang chờ phân công, sắp xếp theo mức ưu tiên và hạn cam kết, và lọc theo trung tâm, mức ưu tiên hoặc trạng thái, để biết và tìm nhanh phiếu cần xử lý trước.</td>
<td>MUST</td>
<td><p><strong>Given</strong> có phiếu "Mới" thuộc trung tâm <strong>When</strong> quản lý mở danh sách chờ <strong>Then</strong> hiển thị CAO → TRUNG_BINH → THẤP; cùng mức thì hạn cam kết gần nhất trước.</p>
<p><strong>Given</strong> danh sách đang hiển thị <strong>When</strong> lọc theo "Đã phân công" và mức CAO <strong>Then</strong> chỉ hiển thị phiếu thỏa cả hai điều kiện.</p>
<p>(NL) <strong>Given</strong> không có phiếu "Mới" <strong>When</strong> mở danh sách chờ <strong>Then</strong> hiển thị "Không có phiếu chờ phân công".</p></td>
</tr>
<tr class="odd">
<td>US02</td>
<td>Là Quản lý trung tâm, tôi muốn phân công kỹ thuật viên phù hợp cho một phiếu mới, để phiếu được xử lý đúng chuyên môn và khối lượng việc chia công bằng.</td>
<td>MUST</td>
<td><p><strong>Given</strong> phiếu "Mới" nhóm sự cố X thuộc trung tâm Y <strong>When</strong> bấm "Đề xuất kỹ thuật viên" <strong>Then</strong> chỉ hiện kỹ thuật viên thuộc Y, tay nghề ≥ 3 với X, số phiếu đang mở tăng dần.</p>
<p><strong>Given</strong> danh sách đề xuất đang hiển thị <strong>When</strong> chọn kỹ thuật viên A và xác nhận <strong>Then</strong> phiếu gán cho A, chuyển "Đã phân công", ghi lịch sử thay đổi.</p>
<p>(NL) <strong>Given</strong> không có kỹ thuật viên thỏa điều kiện <strong>When</strong> bấm "Đề xuất" <strong>Then</strong> báo "Không tìm thấy kỹ thuật viên phù hợp" và cho chọn thủ công trong trung tâm.</p></td>
</tr>
<tr class="even">
<td>US03</td>
<td>Là Quản lý trung tâm, tôi muốn đổi kỹ thuật viên của phiếu và ghi lại lý do, để mọi thay đổi đều có lịch sử.</td>
<td>MUST</td>
<td><p><strong>Given</strong> phiếu đã phân công cho A <strong>When</strong> đổi sang B và nhập lý do <strong>Then</strong> cập nhật kỹ thuật viên và ghi lịch sử (thời gian, người thực hiện, lý do).</p>
<p>(NL) <strong>Given</strong> phiếu "Đang xử lý" <strong>When</strong> cố đổi kỹ thuật viên <strong>Then</strong> cảnh báo và yêu cầu xác nhận trước khi đổi.</p>
<p>(NL) <strong>Given</strong> chưa nhập lý do <strong>When</strong> bấm lưu <strong>Then</strong> từ chối, báo "Vui lòng nhập lý do đổi kỹ thuật viên".</p></td>
</tr>
<tr class="odd">
<td>US04</td>
<td>Là Quản lý trung tâm, tôi muốn đặt lịch hẹn giao – nhận máy vào khung giờ còn trống của kỹ thuật viên, để tránh xung đột thời gian.</td>
<td>SHOULD</td>
<td><p><strong>Given</strong> phiếu đã phân công cho A và A chưa có lịch khác trong khung giờ <strong>When</strong> đặt lịch hẹn <strong>Then</strong> lưu lịch hẹn.</p>
<p>(NL) <strong>Given</strong> A đã có lịch trong khung giờ đó <strong>When</strong> đặt lịch <strong>Then</strong> báo trùng lịch và không lưu.</p></td>
</tr>
<tr class="even">
<td>US05</td>
<td>Là Kỹ thuật viên, tôi muốn xem danh sách phiếu được giao cho mình theo hạn cam kết gần nhất và cập nhật trạng thái phiếu (Đang xử lý, Hoàn tất), để ưu tiên phiếu sắp quá hạn và để quản lý, khách hàng biết tiến độ.</td>
<td>SHOULD</td>
<td><p><strong>Given</strong> đã được phân công ≥ 1 phiếu <strong>When</strong> mở danh sách phiếu của tôi <strong>Then</strong> hiển thị theo hạn cam kết tăng dần.</p>
<p>(NL) <strong>Given</strong> chưa được giao phiếu <strong>When</strong> mở danh sách <strong>Then</strong> hiển thị "Bạn chưa có phiếu được giao".</p>
<p><strong>Given</strong> phiếu "Đã phân công" cho tôi <strong>When</strong> chuyển sang "Đang xử lý" <strong>Then</strong> lưu trạng thái mới và ghi lịch sử.</p>
<p>(NL) <strong>Given</strong> phiếu "Đã phân công" <strong>When</strong> chuyển thẳng sang "Hoàn tất" <strong>Then</strong> từ chối, báo "Phải chuyển qua Đang xử lý trước".</p></td>
</tr>
<tr class="odd">
<td>US06</td>
<td>Là Quản lý trung tâm, tôi muốn xem tổng quan số phiếu trong ngày, số phiếu sắp quá hạn và số phiếu đang mở của từng kỹ thuật viên, để điều phối kịp thời.</td>
<td>SHOULD</td>
<td><strong>Given</strong> trung tâm có phiếu trong ngày <strong>When</strong> mở màn hình tổng quan <strong>Then</strong> hiển thị đúng 3 số liệu: (1) phiếu phát sinh hôm nay; (2) phiếu quá hạn hoặc còn ≤ 4 giờ; (3) phiếu đang mở của từng kỹ thuật viên.</td>
</tr>
<tr class="even">
<td>US07</td>
<td>Là Khách hàng, tôi muốn nhận thông báo khi lịch hẹn được đặt hoặc thay đổi, để biết thời gian đến lấy máy.</td>
<td>COULD</td>
<td>Thông báo SMS/email có ngày, giờ, địa điểm trong 1 phút; (NL) lỗi gửi → ghi nhật ký lỗi, thử lại tối đa 3 lần.</td>
</tr>
</tbody>
</table>

## **1.4. Yêu cầu phi chức năng (NFR)**

| **Mã** | **Nhóm**  | **Yêu cầu (có ngưỡng đo được)**                                                                                                            | **Ảnh hưởng tới thiết kế**                            |
|--------|-----------|--------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------|
| NFR01  | Hiệu năng | Đề xuất kỹ thuật viên phản hồi ≤ 2 giây cho ≥ 95% yêu cầu, với tối đa 500 phiếu đang mở.                                                   | Lọc/sắp xếp ở CSDL; idx_ticket_tech                   |
| NFR02  | Hiệu năng | Tải danh sách phiếu (chờ phân công, được giao) ≤ 3 giây với danh sách tối đa 500 phiếu.                                                    | idx_ticket_queue; phân trang 20 dòng                  |
| NFR03  | Đồng thời | Hỗ trợ ≥ 50 người dùng đồng thời mà NFR01 và NFR02 vẫn đạt.                                                                                | Truy vấn tham số hóa; điều kiện ghi chống ghi đè (5b) |
| NFR04  | Khả dụng  | Khả dụng ≥ 99% trong giờ làm việc của trung tâm (đo theo tháng).                                                                           | Triển khai trên Render, kiểm tra sức khỏe /health     |
| NFR05  | Truy vết  | 100% thay đổi kỹ thuật viên và trạng thái phiếu được ghi vào lịch sử thay đổi (thời gian, người thực hiện, lý do); lưu lịch sử ≥ 12 tháng. | Bảng ticket_log; ghi cùng transaction                 |
| NFR06  | Thông báo | Thông báo lịch hẹn gửi tới khách ≤ 1 phút sau khi lịch được lưu; thử lại tối đa 3 lần nếu lỗi.                                             | NotificationService bất đồng bộ                       |

## **1.5. Ràng buộc và quy tắc nghiệp vụ**

Ràng buộc: stack Node.js (Express) + ReactJS + PostgreSQL, triển khai trên Render, công cụ Postman và Git; prototype chạy được trước Buổi 12. Nhật ký và tài khoản người dùng dùng dịch vụ xác thực có sẵn (ngoài phạm vi); vì dự án chưa có dịch vụ đó, Sprint 2 dựng bản đăng nhập tối thiểu với ba tài khoản demo (TD-14).

- QT-01: Phiếu tuân thủ vòng đời Mới → Đã phân công → Đang xử lý → Hoàn tất, không được bỏ qua bước.

- QT-02: Một phiếu chỉ được gán tối đa 1 kỹ thuật viên tại một thời điểm.

- QT-03: Phân công luôn trong cùng trung tâm; danh sách đề xuất tự động chỉ gồm kỹ thuật viên có tay nghề ≥ 3.

- QT-04: Đổi kỹ thuật viên bắt buộc nhập lý do và ghi lịch sử; phiếu "Đang xử lý" cần xác nhận trước khi đổi.

- QT-05: Một kỹ thuật viên không có hai lịch hẹn trùng khung giờ.

- QT-06: Cảnh báo khi kỹ thuật viên đã có ≥ 10 phiếu đang mở.

## **1.6. Bảng truy vết**

FR ↔ User Story (7 story; US01 phủ FR01 và FR08, US05 phủ FR05 và FR09) ↔ Use Case ↔ MoSCoW ↔ Bảng dữ liệu ↔ Màn hình. Không còn ô trống; mọi bảng của ERD xuất hiện ít nhất một lần ở cột "Bảng dữ liệu".

| **FR**   | **US** | **Use Case**                                    | **MoSCoW** | **Bảng dữ liệu**                                 | **Màn hình** |
|----------|--------|-------------------------------------------------|------------|--------------------------------------------------|--------------|
| **FR01** | US01   | UC02 Xem danh sách phiếu chờ phân công          | MUST       | ticket, service_center                           | M1           |
| **FR02** | US02   | UC01 Phân công kỹ thuật viên cho phiếu bảo hành | MUST       | ticket, technician, technician_skill, ticket_log | M2           |
| **FR03** | US03   | UC03 Đổi kỹ thuật viên của phiếu                | MUST       | ticket, technician, ticket_log                   | M2           |
| **FR04** | US04   | UC04 Đặt lịch hẹn giao nhận máy                 | SHOULD     | appointment, ticket                              | M2           |
| **FR05** | US05   | UC05 Xem danh sách phiếu được giao              | SHOULD     | ticket, appointment                              | M3           |
| **FR06** | US06   | UC06 Xem tổng quan khối lượng công việc         | SHOULD     | ticket, technician                               | M1           |
| **FR07** | US07   | UC07 Gửi thông báo lịch hẹn cho khách hàng      | COULD      | appointment, ticket (customer_phone)             | M2           |
| **FR08** | US01   | UC08 Lọc danh sách phiếu bảo hành               | COULD      | ticket, service_center                           | M1           |
| **FR09** | US05   | UC09 Cập nhật trạng thái phiếu                  | SHOULD     | ticket, ticket_log                               | M3           |

