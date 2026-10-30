#!/usr/bin/env bash
# Thử dựng hệ thống từ THẺ v0.2 trên GitHub, đúng như người chấm sẽ làm (tiêu chí C1):
#   git clone --branch v0.2 <repo>  →  npm run install:all  →  db:create  →  migrate (2 lần)  →  test:full
# Chạy từ thư mục repo hiện tại, SAU KHI đã push thẻ:    bash scripts/thu-clone-tag.sh            (mặc định v0.2)
# Tham số tùy chọn: $1 = tên thẻ, $2 = thư mục thử (mặc định ../smartcrm-v02-thu). Không ghi gì vào repo, không in mật khẩu.
set -u
SRC="$(cd "$(dirname "$0")/.." && pwd)"
TAG="${1:-v0.2}"
URL="$(git -C "$SRC" remote get-url origin)"
DEST="${2:-$SRC/../smartcrm-v02-thu}"
LOG="$(mktemp)"
say() { echo "$@" | tee -a "$LOG"; }
step() { # step "<tên bước>" <số dòng cuối cần hiện> <lệnh...>   (chạy lệnh, ghi nhật ký, hiện vài dòng cuối làm bằng chứng)
  local name="$1" show="$2"; shift 2
  local tmp; tmp="$(mktemp)"
  say ""; say "=== $name"; say "\$ $*"
  if "$@" >"$tmp" 2>&1; then
    cat "$tmp" >>"$LOG"
    [ "$show" -gt 0 ] && tail -n "$show" "$tmp" | sed 's/^/    | /'
    say "    -> ĐẠT"
  else
    cat "$tmp" >>"$LOG"; say "    -> LỖI ở bước: $name"; tail -n 20 "$tmp"; exit 1
  fi
}

say "Thử clone từ thẻ $TAG – $(date '+%d/%m/%Y %H:%M')"
say "Nguồn: $URL"
say "Thư mục thử: $DEST"
if [ -e "$DEST" ]; then say "Thư mục thử đã tồn tại. Xóa nó (hoặc truyền đường dẫn khác ở tham số 2) rồi chạy lại."; exit 1; fi
if [ ! -f "$SRC/.env" ]; then say "Chưa có $SRC/.env – hãy tạo .env trước (README bước 2)."; exit 1; fi

step "1. git clone --branch $TAG" 0 git clone --branch "$TAG" "$URL" "$DEST"
cd "$DEST" || exit 1
say "    thẻ trong bản clone: $(git describe --tags --exact-match 2>/dev/null || echo 'KHÔNG phải thẻ!')   commit: $(git rev-parse --short HEAD)"
[ -e .env ] && { say "LỖI: .env nằm trong repo trên GitHub (lộ mật khẩu!)"; exit 1; }
[ -d node_modules ] && { say "LỖI: node_modules nằm trong repo trên GitHub"; exit 1; }
cp "$SRC/.env" .env; say "(.env chép từ thư mục làm việc – README bước 2; không nằm trên GitHub)"
step "2. npm run install:all" 2 npm run install:all
step "3. npm run db:create" 1 npm run db:create
step "4. npm run migrate (lần 1)" 4 npm run migrate
step "5. npm run migrate (lần 2 – phải bỏ qua, không lỗi)" 4 npm run migrate
step "6. npm run test:full" 9 npm run test:full
say ""; say "KẾT QUẢ: thẻ $TAG clone về dựng và chạy test được theo README. Chụp màn hình cửa sổ này."
say "Nhật ký đầy đủ: $LOG   ·   Dọn thư mục thử khi xong:  rm -rf \"$DEST\""
