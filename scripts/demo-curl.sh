#!/usr/bin/env bash
# Gọi thử API và lưu kết quả vào docs/ket-qua-chay/curl-output.txt (chụp màn hình terminal này để nộp).
# Cần: server đang chạy (npm start), đã `npm run migrate`, có node. ID phiếu/KTV lấy động nên không phụ thuộc thứ tự seed.
B=${BASE:-http://localhost:3000/api}
OUT="$(dirname "$0")/../docs/ket-qua-chay/curl-output.txt"
js() { node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log($1)})"; }
# In lệnh ra màn hình nhưng che token để không lọt vào file kết quả sẽ commit
run() { echo; echo "\$ $*" | sed "s/$TOKEN/<token>/g"; "$@" -s -w '\nHTTP %{http_code}\n'; }

# Đăng nhập (Sprint 2): mọi endpoint trừ /health và /auth/login cần "Authorization: Bearer <token>"
LOGIN=$(curl -s -X POST "$B/auth/login" -H 'Content-Type: application/json' \
  -d "{\"username\":\"${DEMO_USER:-dieu.phoi}\",\"password\":\"${DEMO_PASSWORD:-demo123}\"}")
TOKEN=$(echo "$LOGIN" | js 'j.data ? j.data.token : (j.token || "")')
if [ -z "$TOKEN" ]; then echo "Đăng nhập thất bại. Server trả về: $LOGIN"; exit 1; fi
AUTH="Authorization: Bearer $TOKEN"

# Tạo 1 phiếu MỚI (POST /tickets) để demo chạy lại được nhiều lần; MAN_HINH + trung tâm 1 có >= 2 KTV phù hợp
DUE=$(node -e "console.log(new Date(Date.now()+2*864e5).toISOString())")
CREATED=$(curl -s -X POST "$B/tickets" -H 'Content-Type: application/json' -H "$AUTH" \
  -d "{\"centerId\":1,\"customerName\":\"Khach Demo\",\"customerPhone\":\"0912999999\",\"deviceModel\":\"iPhone 13\",\"issueGroup\":\"MAN_HINH\",\"priority\":1,\"issueDescription\":\"Vo man hinh\",\"dueDate\":\"$DUE\"}")
TID=$(echo "$CREATED" | js 'j.data.ticket_id')
if [ -z "$TID" ] || [ "$TID" = "undefined" ]; then echo "Không tạo được phiếu demo. Server trả về: $CREATED"; exit 1; fi
KTV=$(curl -s -H "$AUTH" "$B/tickets/$TID/suggestions" | js 'j.data[0].technician_id')
KTV2=$(curl -s -H "$AUTH" "$B/tickets/$TID/suggestions" | js 'j.data[1].technician_id')
JSON='Content-Type: application/json'
{
  echo "# Phiếu thử: $TID · KTV đề xuất đầu bảng: $KTV"
  run curl "$B/health"
  echo; echo "# Không có token → 401 (giao diện sẽ đưa về trang đăng nhập)"
  run curl "$B/tickets"
  run curl "$B/tickets?status=MOI" -H "$AUTH"
  run curl "$B/tickets/$TID/suggestions" -H "$AUTH"
  run curl -X POST "$B/tickets/$TID/assign" -H "$JSON" -H "$AUTH" -d "{\"technicianId\":$KTV}"
  echo; echo "# Ba kết quả mong đợi: 409 phân công lại phiếu đã có KTV · 400 đổi KTV không có lý do · 200 đổi KTV có lý do"
  run curl -X POST "$B/tickets/$TID/assign" -H "$JSON" -H "$AUTH" -d "{\"technicianId\":$KTV2}"
  run curl -X POST "$B/tickets/$TID/reassign" -H "$JSON" -H "$AUTH" -d "{\"technicianId\":$KTV2}"
  run curl -X POST "$B/tickets/$TID/reassign" -H "$JSON" -H "$AUTH" -d "{\"technicianId\":$KTV2,\"reason\":\"KTV cu nghi om\"}"
  run curl "$B/tickets/$TID/history" -H "$AUTH"
} | tee "$OUT"
