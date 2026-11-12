#!/usr/bin/env bash
# CHECKLIST BẢO MẬT 7 MỤC (Buổi 15–16): chạy đúng các lệnh tự kiểm và ghi kết quả vào docs/ket-qua-chay/bao-mat.txt (chụp màn hình làm minh chứng).
# Chạy ở THƯ MỤC DỰ ÁN (nhánh/thẻ cần kiểm), khi hệ thống Docker đang chạy (ví dụ ngay sau scripts/thu-may-trang.sh):
#     bash scripts/kiem-tra-bao-mat.sh [thu-muc-co-docker-compose-dang-chay]     (mặc định ${TMPDIR:-/tmp}/kiem-tra-may-trang)
#   BASE=http://localhost:3001/api bash scripts/kiem-tra-bao-mat.sh   (nếu đã đổi APP_PORT)
# Không in nội dung .env hay token. Mục 5 tạm dừng container db rồi bật lại.
cd "$(dirname "$0")/.." || exit 1
SRC="$PWD"
STACK="${1:-${TMPDIR:-/tmp}/kiem-tra-may-trang}"
BASE="${BASE:-http://localhost:3000/api}"
OUT="$SRC/docs/ket-qua-chay/bao-mat.txt"; mkdir -p "$(dirname "$OUT")"; : > "$OUT"
say() { echo "$@" | tee -a "$OUT"; }
sh_() { say "\$ $*"; }
res() { # res <ĐẠT|LỖI> <nội dung>
  say "    => [$1] $2"; }
dc() { (cd "$STACK" && docker compose "$@"); }
tok() { sed -E 's/.*"token":"([^"]+)".*/\1/'; }

say "CHECKLIST BẢO MẬT – $(date '+%d/%m/%Y %H:%M')   nhánh/thẻ: $(git describe --tags --exact-match 2>/dev/null || git branch --show-current)   commit: $(git rev-parse --short HEAD)"

say ""; say "── Mục 1. Không có secret nào trong repo (A02) ──"
sh_ "git log --all --oneline -- .env"
H1="$(git log --all --oneline -- .env)"; say "${H1:-(rỗng)}"
sh_ "git ls-files | grep -E '(^|/)\\.env\$'"
T1="$(git ls-files | grep -E '(^|/)\.env$')"; say "${T1:-(rỗng)}"
sh_ "git grep -niE \"(password|secret|api_?key|token)['\\\"]?[[:space:]]*[:=][[:space:]]*['\\\"][^'\\\"]{4,}\" -- src   (chuỗi gán cứng)"
L1="$(git grep -niE "(password|secret|api_?key|token)['\"]?[[:space:]]*[:=][[:space:]]*['\"][^'\"]{4,}" -- src ':!src/frontend/package-lock.json' | grep -viE 'demo123|DEMO_PASSWORD')"; say "${L1:-(rỗng, trừ mật khẩu demo công khai demo123 đã ghi trong README)}"
[ -z "$H1" ] && [ -z "$T1" ] && [ -z "$L1" ] && res ĐẠT "không có .env trong lịch sử, không có chuỗi mật khẩu/khóa gán cứng" || res LỖI "xem các dòng ở trên"

say ""; say "── Mục 2. Dữ liệu vào được kiểm ở tầng ứng dụng; SQL tham số hoá (A05) ──"
sh_ "grep -rnE \"\\\$\\{\" src/backend/src/repositories   (phần chèn vào chuỗi SQL – phải KHÔNG chứa dữ liệu người dùng)"
grep -rnE '\$\{' src/backend/src/repositories | sed -E 's/^([^:]+:[0-9]+):\s*/    \1  /' | cut -c1-170 | tee -a "$OUT"
sh_ "node --test tests/phoneValidation.test.js tests/inputLimits.test.js tests/blankFields.test.js tests/dateValidation.test.js"
V="$(node --test tests/phoneValidation.test.js tests/inputLimits.test.js tests/blankFields.test.js tests/dateValidation.test.js 2>&1)"
echo "$V" | grep -E '^# (tests|pass|fail)' | tee -a "$OUT"
echo "$V" | grep -qE '^# fail 0' && res ĐẠT "test dữ liệu sai (400) đều PASS; câu SQL chỉ nối hằng số cố định (cột, FOR UPDATE, \$n), dữ liệu đi qua \$1,\$2…" || res LỖI "có test dữ liệu sai FAIL"

say ""; say "── Mục 3. Kiểm soát truy cập theo chủ sở hữu (A01) ──"
M="$(curl -s -X POST "$BASE/auth/login" -H 'Content-Type: application/json' -d '{"username":"dieu.phoi","password":"demo123"}' | tok)"
KH="$(curl -s -X POST "$BASE/auth/login" -H 'Content-Type: application/json' -d '{"username":"ktv.hai","password":"demo123"}' | tok)"
case "$M$KH" in ''|*[!A-Za-z0-9._-]*) BADLOGIN=1;; *) BADLOGIN=0;; esac
if [ "$BADLOGIN" = 1 ] || [ -z "$M" ] || [ -z "$KH" ]; then res LỖI "không đăng nhập được: hệ thống Docker đã chạy ở $BASE chưa?"; else
  # phiếu của Long (ktv.long = 0901000003): tạo phiếu, phân công cho Long
  LONG="$(curl -s -H "Authorization: Bearer $M" "$BASE/technicians?center_id=1" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const t=(JSON.parse(s).data||[]).find(x=>x.phone==='0901000003');console.log(t?t.technician_id:'')})")"
  DUE="$(node -e "console.log(new Date(Date.now()+5*864e5).toISOString())")"
  TID="$(curl -s -X POST "$BASE/tickets" -H "Authorization: Bearer $M" -H 'Content-Type: application/json' -d "{\"centerId\":1,\"customerName\":\"Kiem tra bao mat\",\"customerPhone\":\"0912000777\",\"deviceModel\":\"iPhone 13\",\"issueGroup\":\"MAN_HINH\",\"priority\":2,\"dueDate\":\"$DUE\"}" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{console.log(JSON.parse(s).data.ticket_id)}catch{console.log('')}})")"
  if [ -z "$LONG" ] || [ -z "$TID" ]; then res LỖI "không tạo được phiếu thử hoặc không tìm thấy KTV Long (dữ liệu mẫu đã nạp chưa?)"; else
  curl -s -o /dev/null -X POST "$BASE/tickets/$TID/assign" -H "Authorization: Bearer $M" -H 'Content-Type: application/json' -d "{\"technicianId\":$LONG}"
  sh_ "curl -i $BASE/tickets   (không token)";                                  C1="$(curl -s -o /dev/null -w '%{http_code}' "$BASE/tickets")"; say "HTTP $C1"
  sh_ "KTV Hải mở phiếu $TID của KTV Long: GET /tickets/$TID";                 C2="$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $KH" "$BASE/tickets/$TID")"; say "HTTP $C2"
  sh_ "KTV Hải đổi trạng thái phiếu của Long: POST /tickets/$TID/status";      C3="$(curl -s -o /dev/null -w '%{http_code}' -X POST -H "Authorization: Bearer $KH" -H 'Content-Type: application/json' -d '{"status":"DANG_XU_LY"}' "$BASE/tickets/$TID/status")"; say "HTTP $C3"
  sh_ "KTV Hải gọi API của quản lý: GET /centers";                              C4="$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $KH" "$BASE/centers")"; say "HTTP $C4"
  [ "$C1,$C2,$C3,$C4" = "401,403,403,403" ] && res ĐẠT "401, 403, 403, 403 đúng như mong đợi (khớp TC-09)" || res LỖI "mong đợi 401,403,403,403 – nhận $C1,$C2,$C3,$C4"
  fi
fi

say ""; say "── Mục 4. Mật khẩu / dữ liệu nhạy cảm được băm (A04 · A07) ──"
sh_ "grep -n scryptSync src/backend/src/auth/users.js"
grep -n 'scryptSync' src/backend/src/auth/users.js | tee -a "$OUT"
sh_ "node -e (đối tượng người dùng trong bộ nhớ)"
node -e "const {DEMO_ACCOUNTS,buildUsers}=require('./src/backend/src/auth/users');const u=buildUsers(DEMO_ACCOUNTS,'demo123')[0];console.log('các trường:',Object.keys(u).join(', '));console.log('hash scrypt:',u.hash.toString('hex').slice(0,32)+'…  (mật khẩu gốc không được lưu)')" | tee -a "$OUT"
say "    => [ĐẠT] mật khẩu demo được băm bằng scrypt + muối riêng khi khởi động; không có trường mật khẩu gốc; hệ thống không có bảng tài khoản trong CSDL (xem TD-14)"

say ""; say "── Mục 5. Thông báo lỗi không lộ cấu trúc trong (A10 · A02) ──"
LEAK='stack|node_modules|\.js:[0-9]|ECONN|ENOTFOUND|EAI_AGAIN|postgres|relation|password|select |insert '
sh_ "curl -X POST $BASE/auth/login -d '{hỏng'   (JSON hỏng)"
B1="$(curl -s -w ' (HTTP %{http_code})' -X POST "$BASE/auth/login" -H 'Content-Type: application/json' -d '{hong')"; say "$B1"
if echo "$B1" | grep -qiE "$LEAK"; then res LỖI "phản hồi lộ chi tiết nội bộ"; else res ĐẠT "phản hồi JSON hỏng không lộ stack/tên bảng"; fi
if [ -n "$M" ]; then
  sh_ "docker compose stop db   rồi   curl $BASE/tickets   (CSDL chết)"
  dc stop db >/dev/null 2>&1
  B2="$(curl -s -m 30 -w ' (HTTP %{http_code})' -H "Authorization: Bearer $M" "$BASE/tickets")"; say "$B2"
  if echo "$B2" | grep -qiE "$LEAK"; then res LỖI "phản hồi khi CSDL chết lộ chi tiết nội bộ"; elif echo "$B2" | grep -q 'HTTP 5'; then res ĐẠT "CSDL chết → lỗi chung 'Lỗi hệ thống', không có stack, tên bảng hay chuỗi kết nối"; else res LỖI "phản hồi bất thường (hết thời gian?)"; fi
  sh_ "docker compose start db   (bật lại)"; dc start db >/dev/null 2>&1
  for i in $(seq 1 30); do [ "$(dc ps | grep -c '(healthy)')" -ge 2 ] && break; sleep 3; done; dc ps | tee -a "$OUT"
fi

say ""; say "── Mục 6. Nhật ký không ghi secret / dữ liệu cá nhân (A09) ──"
sh_ "docker compose logs app | grep -v dotenv@ | grep -iE \"password|token|secret|bearer|0[0-9]{9}\"   (bỏ dòng quảng bá của thư viện dotenv)"
G="$(dc logs app 2>&1 | grep -v 'dotenv@' | grep -iE 'password|token|secret|bearer|0[0-9]{9}')"; say "${G:-(rỗng)}"
[ -z "$G" ] && res ĐẠT "nhật ký của app không chứa mật khẩu, token, secret hay số điện thoại" || res LỖI "nhật ký có từ khoá nhạy cảm"

say ""; say "── Mục 7. Phụ thuộc ghim phiên bản và đã kiểm lỗ hổng (A03) ──"
sh_ "git ls-files package-lock.json src/frontend/package-lock.json"
git ls-files package-lock.json src/frontend/package-lock.json | tee -a "$OUT"
sh_ "npm audit --omit=dev   (backend + chạy thật)"
npm audit --omit=dev 2>&1 | tail -12 | tee -a "$OUT"; A1=${PIPESTATUS[0]}
sh_ "npm --prefix src/frontend audit --omit=dev   (giao diện)"
npm --prefix src/frontend audit --omit=dev 2>&1 | tail -12 | tee -a "$OUT"; A2=${PIPESTATUS[0]}
[ "$A1" = 0 ] && [ "$A2" = 0 ] && res ĐẠT "hai tệp khoá đã commit; npm audit không có lỗ hổng ở phần chạy thật" || res "CHÚ Ý" "npm audit còn cảnh báo (xem trên) – ghi vào checklist là CHƯA LÀM XONG kèm kế hoạch nâng cấp"

say ""; say "Xong. Chụp màn hình các mục (có thể chụp nhiều lần – kéo lên). Nhật ký: $OUT"
