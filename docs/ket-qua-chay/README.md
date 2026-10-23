# Ảnh kết quả chạy

Lưu vào thư mục này sau khi chạy trên máy của em. **Che hoặc không chụp nội dung file `.env`** (có mật khẩu CSDL).

## Buổi 8 (Sprint 1)
1. `01-migrate.png` – màn hình `npm run migrate`
2. `02-curl-suggestions-assign.png` – `bash scripts/demo-curl.sh` (hoặc ảnh Postman) với ≥ 2 endpoint
3. `03-npm-test.png` – màn hình `npm test`

## Buổi 10 (Sprint 2) – ảnh toàn luồng
| Tệp | Chụp gì |
|---|---|
| `10-dang-nhap.png` | Trang Đăng nhập (có thể chụp lúc nhập sai mật khẩu để thấy thông báo lỗi) |
| `11-m1-danh-sach.png` | M1 sau khi đăng nhập `dieu.phoi`, có phiếu chờ phân công |
| `12-m2-de-xuat.png` | M2: thông tin phiếu + bảng kỹ thuật viên đề xuất |
| `13-m2-phan-cong-xong.png` | M2 sau khi phân công: thông báo thành công, lịch sử 1 dòng |
| `14-m2-doi-ktv.png` | M2 sau khi đổi kỹ thuật viên kèm lý do, lịch sử 2 dòng |
| `15-m3-phieu-cua-toi.png` | Đăng nhập `ktv.hai`: thấy phiếu vừa được giao |
| `16-m3-rong.png` | Đăng nhập `ktv.long`: trạng thái rỗng "Bạn chưa có phiếu được giao" |
| `17-loi-backend-tat.png` | Tắt backend, bấm Tải lại: thông báo lỗi kèm nút Thử lại |
| `18-npm-test-58.png` | `npm test` hiện số test (đặt `TEST_DATABASE_URL` để thấy pass 58) |
| `19-thu-clone-moi.png` | Kết quả `bash scripts/thu-clone-moi.sh` (dòng KẾT QUẢ cuối) |

Đã có sẵn `test-tich-hop.txt` (19 test Sprint 1) và `kiem-tra-sql.txt`: kết quả chạy các câu SQL của repository trên PostgreSQL 16.
