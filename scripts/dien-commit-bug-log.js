// Điền mã và liên kết commit vào docs/bug-log.md: thay mỗi {{commit:BUG-xx}} bằng liên kết đầy đủ lấy từ `git log`.
//   node scripts/dien-commit-bug-log.js
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const file = path.join(ROOT, 'docs', 'bug-log.md');
const sh = (c) => execSync(c, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
let remote = ''; try { remote = sh('git remote get-url origin').replace(/\.git$/, '').replace(/^git@github\.com:/, 'https://github.com/'); } catch { /* chưa có remote */ }
let txt = fs.readFileSync(file, 'utf8');
let n = 0, miss = [];
txt = txt.replace(/\{\{commit:(BUG-\d+)\}\}/g, (_, id) => {
  const sha = sh(`git log -n1 --format=%H --grep="(${id})"`);
  if (!sha) { miss.push(id); return `{{commit:${id}}}`; }
  n++;
  return remote ? `[\`${sha.slice(0, 7)}\`](${remote}/commit/${sha})` : `\`${sha.slice(0, 7)}\``;
});
fs.writeFileSync(file, txt);
console.log(`Đã điền ${n} liên kết commit.${miss.length ? ' CHƯA có commit cho: ' + miss.join(', ') : ''}`);
process.exit(miss.length ? 1 : 0);
