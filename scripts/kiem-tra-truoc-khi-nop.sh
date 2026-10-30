#!/usr/bin/env bash
# Kiểm tra trước khi nộp Bài tập 2 (Buổi 12): tự động hóa 7 việc dọn dẹp trong slide + vài kiểm tra bổ sung.
# Chạy ở thư mục gốc repo:   bash scripts/kiem-tra-truoc-khi-nop.sh
# - Không bao giờ in mật khẩu. Không ghi gì vào repo (để không làm `git status` bẩn).
# - Kết quả: [ĐẠT] / [LỖI] / [CHÚ Ý]. Có [LỖI] thì thoát mã 1.
cd "$(dirname "$0")/.." || exit 1
PASS=0; FAIL=0; WARN=0
ok()   { echo "[ĐẠT]   $*"; PASS=$((PASS+1)); }
bad()  { echo "[LỖI]   $*"; FAIL=$((FAIL+1)); }
warn() { echo "[CHÚ Ý] $*"; WARN=$((WARN+1)); }
head_() { echo; echo "── $* ──"; }

echo "Kiểm tra trước khi nộp – $(date '+%d/%m/%Y %H:%M')   nhánh: $(git branch --show-current 2>/dev/null || echo '?')   commit: $(git rev-parse --short HEAD 2>/dev/null)"

head_ "1. git status sạch, không có node_modules / .env trong repo"
if [ -z "$(git status --porcelain)" ]; then ok "git status: working tree clean"; else bad "còn thay đổi chưa commit:"; git status --short | head -15 | sed 's/^/           /'; fi
BAD_TRACKED="$(git ls-files | grep -E '(^|/)node_modules/|(^|/)\.env$|(^|/)dist/' | head -5)"
if [ -z "$BAD_TRACKED" ]; then ok "không có node_modules/, .env, dist/ trong danh sách file git theo dõi"; else bad "file không được commit: $BAD_TRACKED"; fi
git check-ignore -q .env && ok ".env nằm trong .gitignore" || bad ".env CHƯA được .gitignore bỏ qua"

head_ "2. Không có bí mật thật trong src/"
echo "\$ grep -rniE \"password|api_key|secret\" src/   (chỉ các dòng KHÔNG phải tên biến/tham số; rút gọn)"
git grep -niE "password|api_key|secret" -- src ':!src/frontend/package-lock.json' | cut -c1-140 | head -40 | sed 's/^/    /'
# Chuỗi cố định gán cho password/secret/api_key; bỏ qua mật khẩu demo công khai (demo123) đã ghi trong README
LIT="$(git grep -niE "(password|api_key|secret)[a-z_]*['\"]?\s*[:=]\s*['\"][^'\"\$]{3,}['\"]" -- src | grep -viE 'demo123|DEMO_PASSWORD' | head -5)"
if [ -z "$LIT" ]; then ok "không có chuỗi mật khẩu/khóa gán cứng trong src/ (chỉ còn mật khẩu demo công khai demo123, ghi ở README)"; else bad "có thể là bí mật gán cứng:"; echo "$LIT" | sed 's/^/           /'; fi
if [ -f .env ]; then
  R="$(node -e "
    require('dotenv').config();
    const {spawnSync}=require('node:child_process');
    const vals=['DB_PASSWORD','AUTH_SECRET'].map(k=>[k,process.env[k]]).filter(([,v])=>v&&v.length>=6);
    if(!vals.length){console.log('NA');process.exit(0)}
    const out=[];
    for(const [k,v] of vals){
      const a=spawnSync('git',['grep','-lF','--',v]).stdout.toString().trim();
      const h=spawnSync('git',['log','--all','--oneline','-S'+v]).stdout.toString().trim();
      if(a) out.push(k+':trong-file-theo-doi'); if(h) out.push(k+':trong-lich-su-commit');
    }
    console.log(out.length?out.join(','):'OK');" 2>/dev/null)"
  case "$R" in
    OK) ok "giá trị thật của DB_PASSWORD / AUTH_SECRET (trong .env của em) không xuất hiện trong file đang theo dõi, cũng không trong lịch sử commit";;
    NA|"") warn "không kiểm tra được mật khẩu thật (.env trống/quá ngắn, hoặc chưa chạy npm run install:all)";;
    *)  bad "mật khẩu/khóa thật bị lộ vào git ($R) – KHÔNG nộp; đổi mật khẩu PostgreSQL rồi xử lý lịch sử";;
  esac
else warn "chưa có .env nên bỏ qua kiểm tra mật khẩu thật trong git"; fi

head_ "3. File khóa phiên bản (lock file) đã commit"
for f in package-lock.json src/frontend/package-lock.json; do
  git ls-files --error-unmatch "$f" >/dev/null 2>&1 && ok "$f đã commit" || bad "thiếu $f trong git (chạy: npm run install:all, rồi git add $f)"
done

head_ "4. .env.example có đủ tên biến kèm giá trị mẫu"
if [ -f .env.example ]; then
  for k in DB_HOST DB_PORT DB_NAME DB_USER DB_PASSWORD PORT AUTH_SECRET; do
    v="$(grep -E "^$k=" .env.example | head -1 | cut -d= -f2-)"
    [ -n "$v" ] && ok "$k có giá trị mẫu" || bad "$k thiếu hoặc để trống trong .env.example"
  done
  git ls-files --error-unmatch .env.example >/dev/null 2>&1 && ok ".env.example đã commit" || bad ".env.example chưa commit"
else bad "không có .env.example"; fi

head_ "5. README: phiên bản runtime, mỗi bước một lệnh, lệnh test, clone đúng thẻ"
grep -qE "Node\.js.*(20|22)" README.md && ok "README nêu phiên bản Node.js" || bad "README thiếu phiên bản Node.js"
grep -qE "PostgreSQL.*16" README.md && ok "README nêu phiên bản PostgreSQL" || bad "README thiếu phiên bản PostgreSQL"
grep -q "npm test" README.md && grep -q "test:full" README.md && ok "README có lệnh test (npm test, npm run test:full)" || bad "README thiếu lệnh test"
grep -q -- "--branch v0.2" README.md && ok "README clone đúng thẻ: git clone --branch v0.2" || warn "README chưa ghi 'git clone --branch v0.2'"

head_ "6. Không còn in gỡ lỗi / catch rỗng trong mã nguồn"
echo "\$ console.* trong src/ (xem có phải log khởi động/lỗi hợp lệ không):"
git grep -nE "console\.(log|debug|info|warn|error)" -- 'src/*.js' 'src/*.jsx' | cut -c1-135 | sed 's/^/    /'
EMPTY="$(git grep -nE "catch\s*(\([^)]*\))?\s*\{\s*\}" -- src tests | head -3)"
[ -z "$EMPTY" ] && ok "không có khối catch rỗng" || { bad "có catch rỗng:"; echo "$EMPTY" | sed 's/^/           /'; }
DBG="$(git grep -nE "debugger;|console\.log\(.*(debug|DEBUG|xxx|asdf|here\b|>>>|TODO)" -- src | head -3)"
[ -z "$DBG" ] && ok "không có debugger / log gỡ lỗi" || { bad "có dòng gỡ lỗi:"; echo "$DBG" | sed 's/^/           /'; }
ONLY="$(git grep -nE "\.only\(|test\.skip\(|describe\.skip\(" -- tests | head -3)"
[ -z "$ONLY" ] && ok "không có test bị .only/.skip" || warn "có .only/.skip trong test: $ONLY"

head_ "7. Tài liệu bắt buộc"
for f in README.md docs/thay-doi-thiet-ke.md docs/ai-disclosure.md docs/bug-log.md; do
  git ls-files --error-unmatch "$f" >/dev/null 2>&1 && ok "$f đã commit" || bad "$f chưa có trong git"
done
N="$(grep -c '^### BUG-' docs/bug-log.md 2>/dev/null || echo 0)"
[ "$N" -ge 1 ] && ok "docs/bug-log.md có $N mục lỗi" || bad "docs/bug-log.md chưa có mục lỗi nào"

head_ "8. Thẻ v0.2 (làm sau khi đã tag và push)"
if git rev-parse -q --verify refs/tags/v0.2 >/dev/null; then
  ok "thẻ v0.2 có ở máy, trỏ tới commit $(git rev-parse --short v0.2^{commit})"
  [ "$(git rev-parse v0.2^{commit})" = "$(git rev-parse HEAD)" ] && ok "v0.2 trùng commit hiện tại (HEAD)" || warn "v0.2 KHÁC HEAD hiện tại – HEAD có commit sau thẻ"
  if git ls-remote --exit-code --tags origin v0.2 >/dev/null 2>&1; then ok "thẻ v0.2 ĐÃ có trên GitHub"; else bad "thẻ v0.2 CHƯA lên GitHub: git push origin v0.2   (git push origin main không đẩy thẻ)"; fi
else warn "chưa có thẻ v0.2 (bình thường nếu em chưa tới bước tag)"; fi

echo; echo "══════════ KẾT QUẢ: $PASS đạt · $FAIL lỗi · $WARN chú ý ══════════"
[ "$FAIL" -eq 0 ] && echo "Không có lỗi. Chụp màn hình toàn bộ kết quả này." || echo "Sửa các dòng [LỖI] rồi chạy lại."
[ "$FAIL" -eq 0 ]
