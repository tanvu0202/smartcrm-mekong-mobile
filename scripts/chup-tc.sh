#!/usr/bin/env bash
# Chạy LẦN LƯỢT từng test case, dừng lại sau mỗi case để em chụp ảnh màn hình terminal (mỗi case 1 ảnh).
#   bash scripts/chup-tc.sh truoc     → lượt chạy ĐẦU (trước khi sửa bug), lưu kết quả *.truoc.json
#   bash scripts/chup-tc.sh sau       → lượt chạy CUỐI (sau khi sửa hết), lưu kết quả *.sau.json
# Mỗi case: màn hình được xóa, chạy, rồi chờ em nhấn Enter để sang case tiếp. Ảnh lưu thành docs/screenshots/TC-xx.png (lượt đầu).
cd "$(dirname "$0")/.." || exit 1
LUOT="${1:-truoc}"
case "$LUOT" in truoc|sau) ;; *) echo "Dùng: bash scripts/chup-tc.sh truoc|sau"; exit 1;; esac
for n in 01 02 03 04 05 06 07 08 09 10 11 12; do
  clear 2>/dev/null || printf '\033c'
  node scripts/chay-test-case.js "TC-$n" --ghi="$LUOT"
  echo
  echo ">>> CHỤP ẢNH MÀN HÌNH NGAY BÂY GIỜ (lưu thành docs/screenshots/TC-$n.png), rồi nhấn Enter để sang case tiếp..."
  read -r _
done
echo "Xong 12 test case. Chạy 'npm run tc:all' để xem bảng tổng hợp."
