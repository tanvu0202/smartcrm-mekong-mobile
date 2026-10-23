# Ảnh kết quả chạy

Lưu vào thư mục này sau khi chạy trên máy của em. **Che hoặc không chụp nội dung file `.env`** (có mật khẩu CSDL).

## Buổi 8 (Sprint 1)
1. `01-migrate.png` – màn hình `npm run migrate`
2. `02-curl-suggestions-assign.png` – `bash scripts/demo-curl.sh` (hoặc ảnh Postman) với ≥ 2 endpoint
3. `03-npm-test.png` – màn hình `npm test`

## Buổi 10 (Sprint 2) – ảnh toàn luồng
| Tệp | Chụp gì |
|---|---|
| `10-dang-nhap.png` | Trang Đăng nhập: form (nhập sai mật khẩu để thấy thông báo lỗi) và ba nút tài khoản demo |
| `11-m1-danh-sach.png` | M1 sau khi đăng nhập `dieu.phoi`: ba thẻ tổng quan, bộ lọc, bảng phiếu chờ phân công |
| `12-m2-de-xuat.png` | M2 (phiếu Mới): thông tin phiếu, khối đặt lịch hẹn (còn khóa), bảng kỹ thuật viên đề xuất |
| `13-m2-phan-cong-xong.png` | M2 sau khi phân công: thông báo thành công, khối Đổi kỹ thuật viên, lịch sử 1 dòng |
| `14-m2-lich-hen.png` | M2 sau khi đặt lịch hẹn: "Đã lưu lịch hẹn." và bảng lịch hẹn của phiếu |
| `15-m2-trung-lich.png` | M2 khi đặt lịch chồng giờ: ô đỏ "Kỹ thuật viên đã có lịch trong khung giờ này (trùng lịch)" |
| `16-m2-de-xuat-thay-the.png` | M2 phiếu đã phân công: bảng "Đề xuất kỹ thuật viên thay thế" và khối Đổi kỹ thuật viên |
| `17-m2-doi-ktv.png` | M2 sau khi đổi kỹ thuật viên kèm lý do, lịch sử 2 dòng |
| `18-m3-phieu-cua-toi.png` | Bấm nút **Nguyễn Hải** ở trang Đăng nhập: phiếu được giao kèm cột Lịch hẹn và nút "Bắt đầu xử lý" |
| `19-m3-doi-trang-thai.png` | M3 sau khi bấm "Bắt đầu xử lý" (trạng thái Đang xử lý, nút "Hoàn tất") |
| `20-m3-rong.png` | Bấm nút **Trần Long**: trạng thái rỗng "Bạn chưa có phiếu được giao" |
| `21-m1-rong.png` | M1 khi không còn phiếu Mới ("Không có phiếu chờ phân công") hoặc lọc không khớp |
| `22-loi-backend-tat.png` | Tắt backend, bấm Tải lại: thông báo lỗi kèm nút Thử lại |
| `23-npm-test-90.png` | `npm run test:full` hiện `pass 90` |
| `24-thu-clone-moi.png` | Kết quả `bash scripts/thu-clone-moi.sh` (dòng KẾT QUẢ cuối) |

Đã có sẵn `test-tich-hop.txt` (19 test Sprint 1) và `kiem-tra-sql.txt`: kết quả chạy các câu SQL của repository trên PostgreSQL 16.
