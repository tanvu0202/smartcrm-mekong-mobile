// Xác nhận MỘT bug đã sửa: hiện commit sửa, chạy lại TOÀN BỘ test (đơn vị + tích hợp) và cả 12 test case hệ thống.
//   npm run xac-nhan -- BUG-07        (chụp màn hình kết quả thành docs/screenshots/BUG-07-fixed.png)
const { spawnSync, execSync } = require('node:child_process');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const id = (process.argv[2] || '').toUpperCase();
const TC_OF = { 'BUG-06': null, 'BUG-07': 'TC-05', 'BUG-08': 'TC-06', 'BUG-09': 'TC-07', 'BUG-10': 'TC-08', 'BUG-11': 'TC-11' };
if (!(id in TC_OF)) { console.error('Dùng: npm run xac-nhan -- BUG-06   (BUG-06 … BUG-11)'); process.exit(1); }
const sh = (cmd) => execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
const line = (c = '─') => c.repeat(100);

console.log(line('═'));
console.log(`XÁC NHẬN ${id} ĐÃ SỬA   –   ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`);
console.log(line('═'));

const sha = sh(`git log -n1 --format=%H --grep="(${id})"`);
if (!sha) { console.error(`Chưa có commit nào chứa "(${id})" trong git log. Hãy commit bản sửa trước.`); process.exit(1); }
console.log(`[1/3] Commit sửa: ${sh(`git log -n1 --format="%h  %s" ${sha}`)}`);
console.log(sh(`git show --stat --format= ${sha}`).split('\n').map((l) => '      ' + l).join('\n'));

console.log('\n' + line());
console.log('[2/3] Chạy lại TOÀN BỘ test đơn vị + tích hợp (npm run test:full):');
const full = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'chay-test-day-du.js')], { cwd: ROOT, encoding: 'utf8' });
const out = (full.stdout || '') + (full.stderr || '');
const grab = (k) => (out.match(new RegExp(`^(?:ℹ |# )${k} (\\d+)`, 'm')) || [])[1];
const failed = out.split('\n').filter((l) => /^✖ /.test(l) || /^not ok /.test(l)).slice(0, 8);
const counts = { tests: grab('tests'), pass: grab('pass'), fail: grab('fail'), skipped: grab('skipped') };
if (counts.tests === undefined) { console.log(out.split('\n').slice(-15).join('\n')); }
else console.log(`      tests ${counts.tests}   pass ${counts.pass}   fail ${counts.fail}   skipped ${counts.skipped}`);
failed.forEach((l) => console.log('      ' + l));
const unitOk = counts.tests !== undefined && counts.fail === '0' && full.status === 0;

console.log('\n' + line());
console.log('[3/3] Chạy lại cả 12 test case hệ thống (backend tạm từ mã hiện tại):');
const tc = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'chay-test-case.js'), '--tat-ca', '--gon'], { cwd: ROOT, encoding: 'utf8' });
process.stdout.write(tc.stdout || '');
if (tc.stderr) process.stderr.write(tc.stderr);
const related = TC_OF[id];
const results = [...(tc.stdout || '').matchAll(/^(PASS|FAIL) \S\s+(TC-\d+)/gm)].map((m) => ({ id: m[2], pass: m[1] === 'PASS' }));
const relatedOk = related === null || results.some((r) => r.id === related && r.pass);
const failing = results.filter((r) => !r.pass).map((r) => r.id);

console.log('\n' + line('═'));
if (unitOk && relatedOk) {
  console.log(`KẾT LUẬN: ${id} ĐÃ SỬA – ${related ? related + ' PASS; ' : ''}test:full ${counts.pass} pass / ${counts.fail} fail.`);
  console.log(failing.length ? `          Còn ${failing.length} test case FAIL (${failing.join(', ')}) do các bug khác chưa sửa.` : '          Cả 12/12 test case hệ thống đều PASS.');
} else {
  console.log(`KẾT LUẬN: CHƯA ĐẠT – test:full ${unitOk ? 'xanh' : 'CÓ LỖI'}, ${related || 'test hồi quy'} ${relatedOk ? 'PASS' : 'FAIL'}. Xem chi tiết phía trên.`);
}
console.log(line('═'));
process.exit(unitOk && relatedOk ? 0 : 1);
