#!/usr/bin/env bash
# PHÉP THỬ MÁY TRẮNG (tiêu chí C1, Buổi 15–16): làm đúng các lệnh giảng viên sẽ chạy, đúng theo docs/deployment-guide.md.
#   1) xoá dấu vết lần chạy trước (docker compose down -v)   2) clone THEO THẺ vào thư mục hoàn toàn mới
#   3) cp .env.example .env + docker compose up -d --build   4) kiểm tra "Verify it works" (ps, /api/health, đăng nhập, test)
#   5) chạy lại migration lần hai: dữ liệu không nhân đôi (C8)
# Chạy ở thư mục dự án (sau khi đã push thẻ):   bash scripts/thu-may-trang.sh            (mặc định thẻ v1.0)
# Tuỳ chọn: $1 = tên thẻ hoặc nhánh (thử trước khi có thẻ:  bash scripts/thu-may-trang.sh dev)   $2 = thư mục thử
#           APP_PORT=3001 bash scripts/thu-may-trang.sh   (khi cổng 3000 đang bị chiếm)
# Không in nội dung .env. Kết quả ghi vào docs/ket-qua-chay/may-trang.txt  -> CHỤP MÀN HÌNH cho mục 7 của PDF.
set -u
SRC="$(cd "$(dirname "$0")/.." && pwd)"
TAG="${1:-v1.0}"
URL="$(git -C "$SRC" remote get-url origin)"
DEST="${2:-${TMPDIR:-/tmp}/kiem-tra-may-trang}"
OUT="$SRC/docs/ket-qua-chay/may-trang.txt"
PORT="${APP_PORT:-3000}"
mkdir -p "$(dirname "$OUT")"; : > "$OUT"
say() { echo "$@" | tee -a "$OUT"; }
fail() { say ""; say "[LỖI] $*"; say "Xem 'docker compose logs app --tail 50' trong $DEST, sửa nguyên nhân rồi chạy lại TỪ ĐẦU."; exit 1; }
run() { say ""; say "\$ $*"; "$@" 2>&1 | tee -a "$OUT"; return "${PIPESTATUS[0]}"; }

say "PHÉP THỬ MÁY TRẮNG – $(date '+%d/%m/%Y %H:%M')   thẻ/nhánh: $TAG   cổng: $PORT"
say "Nguồn: $URL"
docker compose version >/dev/null 2>&1 || fail "Chưa có Docker Compose v2. Mở Docker Desktop rồi chạy lại."
docker info >/dev/null 2>&1 || fail "Docker chưa chạy. Mở Docker Desktop, đợi nó báo 'running', rồi chạy lại."

# Bước 1 – xoá dấu vết (thư mục dự án đang làm việc + thư mục thử của lần trước)
say ""; say "=== Bước 1: xoá dấu vết lần chạy trước"
[ -f "$SRC/docker-compose.yml" ] && [ -f "$SRC/.env" ] && (cd "$SRC" && run docker compose down -v)
if [ -d "$DEST" ]; then (cd "$DEST" && [ -f docker-compose.yml ] && run docker compose down -v); fi
rm -rf "$DEST" && mkdir -p "$DEST" || fail "Không tạo được thư mục thử $DEST"

# Bước 2 – clone theo thẻ vào thư mục mới tinh
say ""; say "=== Bước 2: clone theo thẻ vào thư mục trống"
run git clone --branch "$TAG" "$URL" "$DEST" || fail "git clone --branch $TAG thất bại (thẻ đã được push chưa? repo PUBLIC chưa?)"
cd "$DEST" || fail "Không vào được $DEST"
say "thẻ/nhánh: $(git describe --tags --exact-match 2>/dev/null || git branch --show-current)   commit: $(git rev-parse --short HEAD)"
[ -e .env ] && fail ".env nằm trong repo trên GitHub (lộ bí mật!)"
for f in Dockerfile docker-compose.yml .dockerignore .env.example docs/deployment-guide.md; do [ -f "$f" ] || fail "Thiếu $f trong thẻ $TAG"; done

# Bước 3 – HAI LỆNH của người chấm
say ""; say "=== Bước 3: hai lệnh của người chấm (cp .env.example .env  +  docker compose up -d --build)"
cp .env.example .env
[ "$PORT" != "3000" ] && echo "APP_PORT=$PORT" >> .env
say "\$ cp .env.example .env      (đã tạo .env, không in nội dung)"
run docker compose up -d --build || fail "docker compose up -d --build thất bại"

# Bước 4 – Verify it works
say ""; say "=== Bước 4: kiểm tra 'Verify it works' (chờ tối đa 3 phút cho db + app báo healthy)"
OKH=0
for i in $(seq 1 60); do
  n="$(docker compose ps | grep -c '(healthy)')"
  [ "$n" -ge 2 ] && { OKH=1; break; }
  sleep 3
done
run docker compose ps
[ "$OKH" = 1 ] || fail "db/app chưa 'healthy' sau 3 phút"
say ""; say "\$ curl -s http://localhost:$PORT/api/health"
H="$(curl -s -w ' (HTTP %{http_code})' "http://localhost:$PORT/api/health")"; say "$H"
case "$H" in *'"status":"ok"'*'"db":"up"'*) ;; *) fail "/api/health không trả {status:ok, db:up}";; esac
say ""; say "\$ curl -s -X POST http://localhost:$PORT/api/auth/login -d '{\"username\":\"dieu.phoi\",...}'   (che token)"
L="$(curl -s -w ' (HTTP %{http_code})' -X POST "http://localhost:$PORT/api/auth/login" -H 'Content-Type: application/json' -d '{"username":"dieu.phoi","password":"demo123"}')"
say "$(echo "$L" | sed -E 's/"token":"[^"]*"/"token":"<đã che>"/')"
case "$L" in *'"role":"QUAN_LY"'*'(HTTP 200)') ;; *) fail "Đăng nhập demo thất bại";; esac
say ""; say "\$ docker compose exec app npm run test:full   (chỉ hiện phần tổng kết)"
T="$(docker compose exec -T app npm run test:full 2>&1)"; TRC=$?
echo "$T" | grep -E '^# (tests|suites|pass|fail|cancelled|skipped)' | tee -a "$OUT"
[ "$TRC" = 0 ] || { echo "$T" | tail -30 | tee -a "$OUT"; fail "test:full có test FAIL trong container"; }

# Bước 5 – chạy lại lần hai (C8): migrate lại, số dòng không đổi
say ""; say "=== Bước 5: chạy lại migration lần hai – số dòng không đổi (C8)"
COUNT="SELECT (SELECT count(*) FROM service_center) AS centers, (SELECT count(*) FROM technician) AS technicians, (SELECT count(*) FROM technician_skill) AS skills FROM (SELECT 1) x"
say "\$ psql ... (trước)";  B4="$(docker compose exec -T db sh -c "psql -At -F' | ' -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" -c \"$COUNT\"")"; say "centers | technicians | skills = $B4"
run docker compose exec -T app npm run migrate
say "\$ psql ... (sau)";  AF="$(docker compose exec -T db sh -c "psql -At -F' | ' -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" -c \"$COUNT\"")"; say "centers | technicians | skills = $AF"
[ -n "$B4" ] && [ "$B4" = "$AF" ] || fail "Số dòng thay đổi sau khi migrate lần hai"

say ""; say "KẾT QUẢ: [ĐẠT] gói $TAG dựng được từ thư mục trống bằng 2 lệnh, db + app healthy, /api/health ok, đăng nhập ok, test:full 0 lỗi, migrate lần hai không nhân đôi."
say "Chụp màn hình cửa sổ này (cả phần docker compose ps và phần tổng kết test). Nhật ký: $OUT"
say "Dọn dẹp khi xong:  cd \"$DEST\" && docker compose down -v"
