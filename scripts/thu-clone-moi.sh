#!/usr/bin/env bash
# Thử dựng hệ thống trên một thư mục clone MỚI, làm đúng từng bước của README mục 3 (checklist Buổi 10).
# Chạy từ thư mục repo hiện tại:   bash scripts/thu-clone-moi.sh
# - Clone từ GitHub (origin của repo này) nên thử đúng cái đã push, không phải bản chưa commit trên máy.
# - Dùng cổng 3999 cho backend thử để không đụng backend đang chạy ở cổng 3000 của em.
# - Kết quả ghi vào docs/ket-qua-chay/thu-clone-moi.txt. Bước nào lỗi thì dừng và nói rõ lỗi ở bước nào của README.
set -u
SRC="$(cd "$(dirname "$0")/.." && pwd)"
URL="${1:-$(git -C "$SRC" remote get-url origin)}"
DEST="${2:-$SRC/../smartcrm-clone-thu}"
FINAL_LOG="$SRC/docs/ket-qua-chay/thu-clone-moi.txt"; LOG="$(mktemp)"
PORT_THU=3999
mkdir -p "$(dirname "$LOG")"
: > "$LOG"
say() { echo "$@" | tee -a "$LOG"; }
BACKEND_PID=""
cleanup() { cp "$LOG" "$FINAL_LOG" 2>/dev/null; [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null; }
trap cleanup EXIT

step() { # step "<tên bước theo README>" <lệnh...>
  local name="$1"; shift
  say ""; say "=== $name"; say "\$ $*"
  if "$@" >>"$LOG" 2>&1; then say "    -> ĐẠT"; else say "    -> LỖI ở bước: $name (xem chi tiết trong $LOG)"; tail -n 15 "$LOG"; exit 1; fi
}

say "Thử clone mới – $(date '+%d/%m/%Y %H:%M')"
say "Nguồn: $URL"
say "Thư mục thử: $DEST"
if [ -e "$DEST" ]; then say "Thư mục thử đã tồn tại. Xóa nó (hoặc truyền đường dẫn khác ở tham số 2) rồi chạy lại."; exit 1; fi

step "Bước 1 – git clone" git clone -b "$(git -C "$SRC" branch --show-current)" "$URL" "$DEST"
cd "$DEST" || exit 1
# .env chứa mật khẩu nên không nằm trên GitHub: chép từ bản đang dùng (đúng như bước 2 của README: tạo .env rồi điền)
if [ -f "$SRC/.env" ]; then cp "$SRC/.env" .env; say "(đã chép .env từ thư mục làm việc – không commit)"; else say "Chưa có $SRC/.env – hãy tạo .env trước."; exit 1; fi

step "Bước 3 – cài thư viện backend + giao diện" npm run install:all
step "Bước 4 – tạo database (nếu chưa có)" npm run db:create
step "Bước 5 – tạo bảng và nạp dữ liệu" npm run migrate
step "Bước 6 – chạy test" npm test

say ""; say "=== Bước 7 – chạy backend và kiểm tra"
PORT=$PORT_THU node src/backend/index.js >>"$LOG" 2>&1 &
BACKEND_PID=$!
ok=0
for i in 1 2 3 4 5 6 7 8 9 10; do
  sleep 1
  if curl -s "http://localhost:$PORT_THU/api/health" | grep -q '"status":"ok"'; then ok=1; break; fi
done
if [ $ok -ne 1 ]; then say "    -> LỖI: backend không trả /api/health sau 10 giây"; tail -n 15 "$LOG"; exit 1; fi
say "    -> /api/health: ok"
LOGIN=$(curl -s -X POST "http://localhost:$PORT_THU/api/auth/login" -H 'Content-Type: application/json' \
  -d '{"username":"dieu.phoi","password":"'"${DEMO_PASSWORD:-demo123}"'"}')
if echo "$LOGIN" | grep -q '"token"'; then say "    -> đăng nhập dieu.phoi: ok"; else say "    -> LỖI đăng nhập: $LOGIN"; exit 1; fi
CODE=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT_THU/api/tickets")
if [ "$CODE" = "401" ]; then say "    -> không có token: 401 (đúng)"; else say "    -> LỖI: không token mà trả $CODE"; exit 1; fi

say ""; say "=== Bước 8 – dựng giao diện (vite build)"
if npm run web:build >>"$LOG" 2>&1; then say "    -> ĐẠT"; else say "    -> LỖI ở bước: vite build"; tail -n 15 "$LOG"; exit 1; fi

say ""; say "KẾT QUẢ: clone mới dựng được hệ thống theo README. Chụp màn hình cửa sổ này lưu vào docs/ket-qua-chay/."
say "Muốn xem giao diện trên bản clone này:  cd \"$DEST\" && npm start   (cửa sổ 1)  ·  npm run web   (cửa sổ 2)"
