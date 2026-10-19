#!/usr/bin/env bash
# Gọi thử API và lưu kết quả vào docs/ket-qua-chay/curl-output.txt (chụp màn hình terminal này để nộp).
# Cần: server đang chạy (npm start), đã `npm run migrate`, có node.
B=${BASE:-http://localhost:3000/api}
OUT="$(dirname "$0")/../docs/ket-qua-chay/curl-output.txt"
js() { node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log($1)})"; }
run() { echo; echo "\$ $*"; "$@" -s -w '\nHTTP %{http_code}\n'; }

# Tạo 1 phiếu MỚI (POST /tickets) để demo chạy lại được nhiều lần; MAN_HINH + trung tâm 1 có >= 2 KTV phù hợp
DUE=$(node -e "console.log(new Date(Date.now()+2*864e5).toISOString())")
CREATED=$(curl -s -X POST "$B/tickets" -H 'Content-Type: application/json' \
  -d "{\"centerId\":1,\"customerName\":\"Khach Demo\",\"customerPhone\":\"0912999999\",\"deviceModel\":\"iPhone 13\",\"issueGroup\":\"MAN_HINH\",\"priority\":1,\"issueDescription\":\"Vo man hinh\",\"dueDate\":\"$DUE\"}")
TID=$(echo "$CREATED" | js 'j.data.ticket_id')
if [ -z "$TID" ] || [ "$TID" = "undefined" ]; then echo "Không tạo được phiếu demo. Server trả về: $CREATED"; exit 1; fi
KTV=$(curl -s "$B/tickets/$TID/suggestions" | js 'j.data[0].technician_id')
KTV2=$(curl -s "$B/tickets/$TID/suggestions" | js 'j.data[1].technician_id')
JSON='Content-Type: application/json'
{
  echo "# Phiếu thử: $TID · KTV đề xuất đầu bảng: $KTV"
  run curl "$B/health"
  run curl "$B/tickets?status=MOI"
  run curl "$B/tickets/$TID/suggestions"
  run curl -X POST "$B/tickets/$TID/assign" -H "$JSON" -d "{\"technicianId\":$KTV,\"changedBy\":\"dieu.phoi\"}"
  echo; echo "# Ba kết quả mong đợi: 409 phân công lại phiếu đã có KTV · 400 đổi KTV không có lý do · 200 đổi KTV có lý do"
  run curl -X POST "$B/tickets/$TID/assign" -H "$JSON" -d "{\"technicianId\":$KTV2,\"changedBy\":\"dieu.phoi\"}"
  run curl -X POST "$B/tickets/$TID/reassign" -H "$JSON" -d "{\"technicianId\":$KTV2,\"changedBy\":\"dieu.phoi\"}"
  run curl -X POST "$B/tickets/$TID/reassign" -H "$JSON" -d "{\"technicianId\":$KTV2,\"changedBy\":\"dieu.phoi\",\"reason\":\"KTV cu nghi om\"}"
  run curl "$B/tickets/$TID/history"
} | tee "$OUT"
