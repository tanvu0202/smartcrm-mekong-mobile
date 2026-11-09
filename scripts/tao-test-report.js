// Sinh docs/test-report.md từ kết quả CHẠY THẬT đã lưu trong docs/ket-qua-chay/tc/ (*.truoc.json = lượt đầu, *.sau.json = lượt cuối).
//   node scripts/tao-test-report.js
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const dir = path.join(ROOT, 'docs', 'ket-qua-chay', 'tc');
const read = (n, k) => { const f = path.join(dir, `${n}.${k}.json`); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null; };
const ids = Array.from({ length: 12 }, (_, i) => `TC-${String(i + 1).padStart(2, '0')}`);
const rows = ids.map((id) => ({ id, a: read(id, 'truoc'), b: read(id, 'sau') }));
if (rows.some((r) => !r.a || !r.b)) {
  console.error('Thiếu kết quả: cần đủ 12 file *.truoc.json và 12 file *.sau.json trong docs/ket-qua-chay/tc/ (chạy chup-tc.sh truoc và sau).');
  process.exit(1);
}
const esc = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
const has = (f) => fs.existsSync(path.join(ROOT, 'docs', 'screenshots', f));
const st = (r) => (r.pass ? 'PASS' : 'FAIL');
const shot = (id) => (has(`${id}.png`) ? `[ảnh](screenshots/${id}.png)` : '*(thiếu ảnh)*');
const when = (r) => new Date(r.runAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
const bugOf = {};
for (const r of rows) if (r.a.bug) bugOf[r.id] = r.a.bug;

const p1 = rows.filter((r) => r.a.pass).length, p2 = rows.filter((r) => r.b.pass).length;
const out = [];
out.push('# Test Report – Buổi 14 (Bài tập 3)', '');
out.push('Hệ thống: Smart CRM Mekong Mobile, luồng L4 *Phân công kỹ thuật viên và lịch hẹn*. Mọi dòng dưới đây là kết quả chạy thật bằng `scripts/chay-test-case.js` vào backend + PostgreSQL trên máy của sinh viên; mỗi test case có ảnh chụp terminal trong `docs/screenshots/`.', '');
out.push(`- Lượt chạy 1 (trước khi sửa bug): ${when(rows[0].a)} – **${p1}/12 PASS, ${12 - p1} FAIL**`);
out.push(`- Lượt chạy cuối (sau khi sửa bug): ${when(rows[11].b)} – **${p2}/12 PASS, ${12 - p2} FAIL**`);
out.push('- Cách chạy lại một test case: `npm run tc -- TC-05` · cả bộ: `npm run tc:all`', '');
out.push('| Mã TC | Loại | Ưu tiên | Dữ liệu vào / bước | Kết quả mong đợi | Kết quả thực tế (lượt 1) | Trạng thái (lượt 1 → cuối) | Minh chứng / Bug |');
out.push('|---|---|---|---|---|---|---|---|');
for (const r of rows) {
  const a = r.a; const bug = bugOf[r.id];
  out.push(`| ${r.id} | ${esc(a.type)} | ${a.priority} | ${esc(a.title)}. ${esc(a.input)} | ${esc(a.expected)} | ${esc(a.actual)} | ${st(a)} → ${st(r.b)} | ${shot(r.id)}${bug ? ` · ${bug}${has(`${bug}-fixed.png`) ? ` ([ảnh sau sửa](screenshots/${bug}-fixed.png))` : ''}` : ''} |`);
}
out.push('');
out.push('## Tổng hợp theo loại', '');
const types = {};
for (const r of rows) { const k = r.a.type.split(' (')[0].split(' /')[0]; (types[k] = types[k] || []).push(r); }
out.push('| Loại | Số case | PASS lượt 1 | PASS lượt cuối |', '|---|---|---|---|');
for (const [k, v] of Object.entries(types)) out.push(`| ${k} | ${v.length} | ${v.filter((x) => x.a.pass).length} | ${v.filter((x) => x.b.pass).length} |`);
out.push('', '## Ghi chú', '');
out.push('- Các lỗi tìm thấy khi chạy được ghi ở `docs/bug-log.md` (BUG-06 … BUG-11), mỗi lỗi sửa trong một commit riêng và có test hồi quy.');
out.push('- Mỗi test case tự tạo dữ liệu riêng (tên "TC khach …", lịch hẹn vào năm 2100–2249) nên chạy lại nhiều lần không đụng nhau; phiếu thử còn lại trong CSDL không ảnh hưởng dữ liệu danh mục.');
out.push('- Trạng thái FAIL ở lượt 1 là kết quả thật, giữ nguyên để truy vết; chúng chuyển PASS sau commit sửa tương ứng.');
fs.writeFileSync(path.join(ROOT, 'docs', 'test-report.md'), out.join('\n') + '\n');
console.log(`Đã ghi docs/test-report.md (lượt 1: ${p1}/12 PASS; lượt cuối: ${p2}/12 PASS).`);
