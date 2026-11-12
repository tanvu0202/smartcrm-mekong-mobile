# Checklist bảo mật — Smart CRM (Mekong Mobile), luồng L4, thẻ v1.0

Bảy hạng mục tự kiểm theo OWASP Top 10, mỗi mục có **một dòng bằng chứng** chạy lại được bằng `bash scripts/kiem-tra-bao-mat.sh` (cần hệ thống Docker đang chạy, xem [Deployment Guide](deployment-guide.md)). Nhật ký lần chạy: [ket-qua-chay/bao-mat.txt](ket-qua-chay/bao-mat.txt).
Ba trạng thái: **ĐÃ LÀM** · **CHƯA LÀM** (có ghi lý do và kế hoạch) · **KHÔNG ÁP DỤNG** (có ghi lý do).

| # | Hạng mục (OWASP) | Trạng thái | Bằng chứng (một dòng) |
|---|---|---|---|
| 1 | Không có secret trong repo (A02) | **ĐÃ LÀM** | `git log --all -- .env` và `git ls-files` không có `.env`; `git grep` không thấy mật khẩu hay khóa gán cứng trong `src` (mục 1 của `bao-mat.txt`) |
| 2 | Kiểm dữ liệu vào và SQL tham số hoá (A05) | **ĐÃ LÀM** | 18 test dữ liệu sai đều PASS (400); các chỗ `${…}` trong `repositories/` chỉ nối hằng cố định (tên cột, `FOR UPDATE`, `$n`), dữ liệu đi qua `$1, $2…` (mục 2) |
| 3 | Kiểm soát truy cập theo vai trò và chủ sở hữu (A01) | **ĐÃ LÀM** | Không token → 401; KTV Hải mở phiếu của KTV Long → 403; đổi trạng thái phiếu của Long → 403; gọi API của quản lý → 403 (mục 3, khớp TC-09) |
| 4 | Mật khẩu được băm (A04, A07) | **ĐÃ LÀM** | Tài khoản trong bộ nhớ chỉ có `username, fullName, role, salt, hash`; băm bằng `crypto.scryptSync` kèm muối riêng, không có trường mật khẩu gốc (mục 4) |
| 5 | Thông báo lỗi không lộ cấu trúc (A10, A02) | **ĐÃ LÀM** | JSON hỏng → 400 thông báo chung; dừng `db` rồi gọi API → **503 `DB_UNAVAILABLE`** thông báo chung, không stack, tên bảng hay chuỗi kết nối (mục 5) |
| 6 | Nhật ký không ghi secret hay dữ liệu cá nhân (A09) | **ĐÃ LÀM** | `docker compose logs app` lọc `password\|token\|secret\|bearer\|số điện thoại` → rỗng (mục 6) |
| 7 | Phụ thuộc được ghim và đã kiểm lỗ hổng (A03) | **ĐÃ LÀM** | Hai `package-lock.json` được theo dõi trong git; `npm audit --omit=dev` ở backend và giao diện đều `found 0 vulnerabilities` sau khi nâng `body-parser` (mục 7; lần chạy trên thẻ v1.0 là bản chốt) |

## Lỗi tìm thấy nhờ chính checklist này

| Mục | Phát hiện | Xử lý |
|---|---|---|
| 5 | Khi CSDL chết, API **treo** đến hết thời gian chờ của client (pool `pg` không đặt thời gian chờ kết nối, không bắt lỗi kết nối rỗi) | BUG-12 trong [bug-log.md](bug-log.md); sửa ở commit `1b0da63`: chờ tối đa 5 giây rồi trả 503, thêm 5 test (`tests/dbUnavailable.test.js`) |
| 7 | `npm audit` báo 1 lỗ hổng mức **high** ở `body-parser` 2.0.0–2.3.0 (từ chối dịch vụ qua body nén có byte thừa; gói đi kèm Express) | `npm audit fix` nâng lên 2.4.0, chạy lại toàn bộ test, commit `7fc73a3` |

## Chưa làm, không áp dụng và giới hạn đã biết

| Hạng mục | Trạng thái | Lý do và kế hoạch |
|---|---|---|
| HTTPS / TLS | **CHƯA LÀM** cho môi trường thật; **KHÔNG ÁP DỤNG** cho bản demo `localhost` | Image chỉ nói HTTP. Khi triển khai thật phải đặt sau reverse proxy có chứng chỉ (nginx, Caddy hoặc bộ cân bằng tải của nhà cung cấp). |
| Giới hạn số lần đăng nhập sai (rate limit, khóa tạm) | **CHƯA LÀM** | Chưa có `express-rate-limit`. Kế hoạch: giới hạn theo IP và theo tên đăng nhập ở `POST /auth/login`. |
| Đăng xuất phía máy chủ, thu hồi token | **CHƯA LÀM** | Token là bản ký không lưu trạng thái, hết hạn sau 8 giờ (`TOKEN_TTL_SECONDS`). Kế hoạch: danh sách thu hồi hoặc token ngắn kèm refresh. |
| Header bảo mật HTTP (`helmet`, CSP) | **CHƯA LÀM** | Chưa thêm thư viện. Giao diện React tự thoát ký tự khi hiển thị nên XSS đã được giảm, nhưng CSP vẫn nên có. |
| Tài khoản người dùng trong CSDL, đổi mật khẩu | **CHƯA LÀM** | Bản demo dùng 3 tài khoản dựng khi khởi động (TD-14). Mật khẩu `demo123` **công khai có chủ đích**, chỉ cho demo; bản thật phải có bảng tài khoản và đặt `DEMO_PASSWORD` mạnh. |
| `AUTH_SECRET` và `DB_PASSWORD` mẫu trong `.env.example` | Giới hạn đã biết | Là giá trị mẫu công khai để chạy được bằng hai lệnh. Phải đổi trước khi triển khai thật (Deployment Guide, mục 3). |
| Tải tệp lên | **KHÔNG ÁP DỤNG** | Hệ thống không nhận tệp từ người dùng. |
| CSRF | **KHÔNG ÁP DỤNG** | Xác thực bằng header `Authorization: Bearer`, không dùng cookie. |
| Mã hoá dữ liệu lưu trong CSDL | **KHÔNG ÁP DỤNG** cho phạm vi bài tập | Cổng CSDL không mở ra máy chủ (chỉ container `app` nối được); mã hoá ổ đĩa thuộc hạ tầng triển khai. |

Ngày kiểm: 12/11/2026 · Người kiểm: Trần Tấn Vũ (2374802010573).
