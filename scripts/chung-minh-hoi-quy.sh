#!/usr/bin/env bash
# Chứng minh bug có thật và bản sửa có tác dụng, ngay trên máy em (dùng khi thầy bảo "chỉ chỗ sai").
#   bash scripts/chung-minh-hoi-quy.sh BUG-06
# Làm 4 việc: (1) hiện đúng những dòng mã mà commit sửa đã đổi (chính là chỗ sai);
#             (2) đưa TẠM thư mục src/ về trạng thái ngay TRƯỚC commit sửa → chạy test hồi quy của bug đó: phải ĐỎ;
#             (3) trả src/ về bản đã sửa → chạy lại: phải XANH.
# Chỉ đụng tới thư mục src/ ; luôn tự khôi phục kể cả khi bấm Ctrl+C. Cần src/ và tests/ đã commit hết.
cd "$(dirname "$0")/.." || exit 1
ID="${1:-}"; [ -n "$ID" ] || { echo "Dùng: bash scripts/chung-minh-hoi-quy.sh BUG-06"; exit 1; }
SHA="$(git log -n1 --format=%H --grep="($ID)")"
[ -n "$SHA" ] || { echo "Không thấy commit nào chứa ($ID) trong git log."; exit 1; }
if [ -n "$(git status --porcelain --untracked-files=no -- src tests)" ]; then echo "Còn thay đổi chưa commit trong src/ hoặc tests/ – hãy commit trước."; git status --short -- src tests; exit 1; fi

TESTS="$(git show --diff-filter=A --name-only --format= "$SHA" | grep -E '^tests/.*\.test\.(js|mjs)$' | tr '\n' ' ')"
restore() { git checkout -q HEAD -- src; }
trap restore EXIT INT TERM

if [ -z "${TEST_DATABASE_URL:-}" ]; then
  TEST_DATABASE_URL="$(node -e "require('dotenv').config();const e=process.env,c=encodeURIComponent;console.log(e.DATABASE_URL||'postgresql://'+c(e.DB_USER||'')+':'+c(e.DB_PASSWORD||'')+'@'+(e.DB_HOST||'localhost')+':'+(e.DB_PORT||5432)+'/'+(e.DB_NAME||'smartcrm'))" 2>/dev/null)"
  export TEST_DATABASE_URL
fi
run() { node --test $TESTS 2>&1 | grep -E "^(✖|✔|ℹ (tests|pass|fail))|^not ok|^# (tests|pass|fail)" | head -14 | sed 's/^/   /'; }

echo "══ $ID – commit sửa: $(git log -n1 --format='%h %s' "$SHA")"
echo "══ Test hồi quy của bug này: $TESTS"
echo
echo "── (1) CHỖ SAI – mã nguồn mà commit sửa đã thay đổi ('-' là mã SAI trước đó, '+' là mã đã sửa):"
git show --format= --unified=1 "$SHA" -- src | grep -E '^(\+\+\+|@@|[-+][^-+])' | cut -c1-170 | head -50 | sed 's/^/   /'
echo
echo "── (2) Đưa TẠM src/ về trạng thái trước commit sửa, rồi chạy test hồi quy (kỳ vọng: ĐỎ):"
git checkout -q "$SHA^" -- src || { echo "Không đưa được src/ về bản cũ."; exit 1; }
run
echo
git checkout -q HEAD -- src
echo "── (3) Đã trả src/ về bản đã sửa. Chạy lại test hồi quy (kỳ vọng: XANH):"
run
echo
echo "Xong. src/ đã được khôi phục: $(git status --porcelain --untracked-files=no -- src | wc -l | tr -d ' ') file thay đổi."
