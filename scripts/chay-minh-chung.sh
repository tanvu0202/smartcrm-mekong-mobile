#!/usr/bin/env bash
# Chạy lần lượt các lệnh làm MINH CHỨNG cho PDF Bài tập 2 (Buổi 12). Mỗi bước hiện một màn hình sạch rồi DỪNG để em chụp.
# Chạy ở thư mục gốc repo, sau khi đã `npm run install:all` và có file .env:
#     bash scripts/chay-minh-chung.sh
# Ảnh phải là cửa sổ terminal THẬT của em, thấy rõ dòng lệnh và kết quả. Không in mật khẩu ra màn hình.
set -u
cd "$(dirname "$0")/.." || exit 1
n=0
banner() { n=$((n+1)); clear 2>/dev/null; echo "=========== ẢNH $n – $1 ==========="; echo; }
pause()  { echo; read -r -p ">>> Chụp màn hình (ảnh $n), lưu tên $(printf '%02d' "$n")-….png, rồi nhấn Enter để sang bước tiếp... " _ </dev/tty; }
show()   { echo "\$ $*"; "$@"; }
BACKEND_PID=""
cleanup() { [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null; }
trap cleanup EXIT

banner "Mục 2 – Kiến trúc: các lớp tách nhau, lớp services không dính HTTP"
show ls src/backend/src/routes src/backend/src/controllers src/backend/src/services src/backend/src/repositories
echo
echo "\$ grep -rnE \"\\breq\\b|\\bres\\b|\\.status\\(|statusCode|\\b(200|201|204|400|401|403|404|409|422|500)\\b\" src/backend/src/services/"
grep -rnE "\breq\b|\bres\b|\.status\(|statusCode|\b(200|201|204|400|401|403|404|409|422|500)\b" src/backend/src/services/ \
  || echo "(không có kết quả: lớp services không dùng req/res/mã HTTP)"
pause

banner "Mục 6 – Migration + seed chạy LẠI không lỗi, không nhân đôi dữ liệu (C5)"
echo "--- Lần 1"; show npm run migrate
echo; echo "--- Số dòng sau lần 1"; show node scripts/dem-dong.js
echo; echo "--- Lần 2 (phải 'bỏ qua', không lỗi)"; show npm run migrate
echo; echo "--- Chạy lại cả file seed một lần nữa, số dòng phải giữ nguyên"; show node scripts/dem-dong.js --seed-lai
pause

banner "Mục 4 – Toàn bộ test chạy bằng MỘT lệnh (cả test tích hợp trên PostgreSQL thật)"
show npm run test:full
pause

banner "Mục 4 – Tên các test CRUD lịch hẹn (hợp lệ / biên / không hợp lệ)"
show node --test tests/appointmentCrud.test.js
pause

banner "Mục 3 – Module cốt lõi chạy thật: CRUD 2 thực thể bằng curl"
if ! curl -s http://localhost:3000/api/health | grep -q '"status":"ok"'; then
  echo "(backend chưa chạy – tự bật tạm ở cổng 3000 để chụp)"
  node src/backend/index.js >/dev/null 2>&1 &
  BACKEND_PID=$!
  for _ in 1 2 3 4 5 6 7 8 9 10; do sleep 1; curl -s http://localhost:3000/api/health | grep -q '"status":"ok"' && break; done
fi
curl -s http://localhost:3000/api/health | grep -q '"status":"ok"' || { echo "Backend không lên được. Mở terminal khác chạy 'npm start' rồi chạy lại script này."; exit 1; }
echo "Backend sẵn sàng. Phần dưới chia 3 màn hình (đăng nhập + phân công · CRUD phiếu · CRUD lịch hẹn)."
read -r -p ">>> Nhấn Enter để bắt đầu... " _ </dev/tty
clear 2>/dev/null
DEMO_OUT="$(mktemp)" COMPACT=1 PAUSE=1 bash scripts/demo-curl.sh
echo; echo "(xong phần curl – ảnh $n, $((n+1)), $((n+2)) là ba màn hình vừa chụp)"; n=$((n+2))

banner "20 commit gần nhất"
echo "\$ git log --oneline | head -20"
git log --oneline | head -20
pause

clear 2>/dev/null
echo "Xong. Còn lại: các ảnh giao diện (xem HUONG_DAN) và các ảnh git/tag/clone sau khi nộp."
