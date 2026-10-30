#!/usr/bin/env bash
# Gọi thử API: đăng nhập, phân công, CRUD PHIẾU và CRUD LỊCH HẸN. Kết quả lưu vào docs/ket-qua-chay/curl-output.txt (chụp màn hình terminal này để nộp).
# Cần: server đang chạy (npm start), đã `npm run migrate`, có node. ID phiếu/KTV lấy động nên không phụ thuộc thứ tự seed.
# Tùy chọn (biến môi trường):
#   COMPACT=1   rút gọn mỗi dòng kết quả (~170 ký tự) để chụp màn hình không bị tràn dòng
#   PAUSE=1     dừng sau từng phần để chụp màn hình, nhấn Enter để đi tiếp
#   DEMO_OUT=…  ghi kết quả vào tệp khác (mặc định docs/ket-qua-chay/curl-output.txt)
B=${BASE:-http://localhost:3000/api}
OUT="${DEMO_OUT:-$(dirname "$0")/../docs/ket-qua-chay/curl-output.txt}"
js() { node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log($1)})"; }
# In lệnh ra màn hình nhưng che token để không lọt vào file kết quả sẽ commit
clip() { if [ "${COMPACT:-0}" = 1 ]; then cut -c1-170 | awk '{ print (length($0) >= 170 ? $0 "…" : $0) }'; else cat; fi; }
pause() { if [ "${PAUSE:-0}" = 1 ]; then read -r -p ">>> Chụp màn hình phần vừa hiện, rồi nhấn Enter để đi tiếp... " _ </dev/tty; fi; }
run() { echo; echo "\$ $*" | sed "s/$TOKEN/<token>/g" | clip; "$@" -s -w '\nHTTP %{http_code}\n' | clip; }
# runv: như run nhưng giữ lại phần thân JSON trong biến LAST (để lấy id vừa tạo mà vẫn hiện đủ kết quả lên màn hình)
runv() { echo; echo "\$ $*" | sed "s/$TOKEN/<token>/g" | clip; local out; out=$("$@" -s -w '\nHTTP %{http_code}\n'); echo "$out" | clip; LAST=$(echo "$out" | sed '$d'); }

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

  # ===== CRUD thực thể 1: PHIẾU (ticket) – tạo · đọc · sửa · xóa =====
  pause
  echo; echo "# ===== CRUD PHIẾU: tạo (201) → đọc (200) → sửa (200) → sửa dữ liệu sai (400) → xóa (204) → đọc lại (404) ====="
  runv curl -X POST "$B/tickets" -H "$JSON" -H "$AUTH" \
    -d "{\"centerId\":1,\"customerName\":\"Khach CRUD\",\"customerPhone\":\"0912888888\",\"deviceModel\":\"Galaxy S22\",\"issueGroup\":\"PIN\",\"priority\":2,\"issueDescription\":\"Chai pin\",\"dueDate\":\"$DUE\"}"
  T2=$(echo "$LAST" | js 'j.data.ticket_id')
  echo "# Phiếu CRUD: $T2"
  run curl "$B/tickets/$T2" -H "$AUTH"
  # PUT thay toàn bộ thông tin phiếu (chỉ khi còn MOI) nên gửi đủ các trường
  FULL="\"centerId\":1,\"deviceModel\":\"Galaxy S22\",\"issueGroup\":\"PIN\",\"priority\":2,\"dueDate\":\"$DUE\""
  run curl -X PUT "$B/tickets/$T2" -H "$JSON" -H "$AUTH" -d "{$FULL,\"customerName\":\"Khach CRUD (da sua)\",\"customerPhone\":\"0912888888\",\"issueDescription\":\"Chai pin, phong pin\"}"
  echo; echo "# Số điện thoại sai định dạng → 400, nêu rõ trường nào sai"
  run curl -X PUT "$B/tickets/$T2" -H "$JSON" -H "$AUTH" -d "{$FULL,\"customerName\":\"Khach CRUD\",\"customerPhone\":\"abc\",\"issueDescription\":\"Chai pin\"}"
  run curl -X DELETE "$B/tickets/$T2" -H "$AUTH"
  run curl "$B/tickets/$T2" -H "$AUTH"

  # ===== CRUD thực thể 2: LỊCH HẸN (appointment) – tạo · đọc · sửa · hủy (xóa mềm) =====
  pause
  echo; echo "# ===== CRUD LỊCH HẸN (của phiếu $TID đã phân công): tạo (201) → đọc (200) → sửa (200) → hủy (204) → hủy lần nữa (409) ====="
  DAY=$(node -e "console.log(new Date(Date.now()+(30+Math.floor(Math.random()*300))*864e5).toISOString().slice(0,10))")
  runv curl -X POST "$B/tickets/$TID/appointments" -H "$JSON" -H "$AUTH" \
    -d "{\"type\":\"GIAO\",\"startTime\":\"${DAY}T02:00:00Z\",\"endTime\":\"${DAY}T03:00:00Z\"}"
  AID=$(echo "$LAST" | js 'j.data.appointment_id')
  echo "# Lịch hẹn: $AID (ngày $DAY)"
  run curl "$B/appointments/$AID" -H "$AUTH"
  run curl -X PUT "$B/appointments/$AID" -H "$JSON" -H "$AUTH" -d "{\"type\":\"NHAN\",\"startTime\":\"${DAY}T02:30:00Z\",\"endTime\":\"${DAY}T03:30:00Z\"}"
  echo; echo "# Dữ liệu sai: giờ kết thúc không sau giờ bắt đầu → 400"
  run curl -X PUT "$B/appointments/$AID" -H "$JSON" -H "$AUTH" -d "{\"type\":\"NHAN\",\"startTime\":\"${DAY}T04:00:00Z\",\"endTime\":\"${DAY}T03:00:00Z\"}"
  run curl -X DELETE "$B/appointments/$AID" -H "$AUTH"
  run curl "$B/appointments/$AID" -H "$AUTH"
  run curl -X DELETE "$B/appointments/$AID" -H "$AUTH"
} | tee "$OUT"
