// Chạy test case THẬT của Buổi 14 vào backend đang chạy (mặc định http://localhost:3000/api).
//   node scripts/chay-test-case.js TC-05                 → chạy 1 test case, in yêu cầu/phản hồi và PASS/FAIL (để chụp ảnh)
//   node scripts/chay-test-case.js --tat-ca              → chạy cả 12 test case, in bảng tổng hợp
//   thêm  --ghi=truoc  hoặc  --ghi=sau   → lưu kết quả vào docs/ket-qua-chay/tc/ (để sinh Test Report)
//   npm run tc:don-dep            → xóa các phiếu thử do test case tạo (issueDescription = 'TC-AUTO'), không đụng dữ liệu khác
//   --gon                         → chỉ in một dòng kết quả cho mỗi test case (dùng khi chạy lại cả bộ)
//   --dung-backend-dang-chay      → gọi backend đang chạy ở API_URL (mặc định http://localhost:3000/api) thay vì tự bật bản tạm
// Mặc định script TỰ BẬT một backend tạm từ mã nguồn hiện tại (cổng ngẫu nhiên, dùng cùng CSDL trong .env) rồi tắt khi xong,
// nên kết quả luôn phản ánh đúng mã đang có trong thư mục, không phụ thuộc việc em có bật `npm start` hay quên khởi động lại.
// Thoát mã 0 nếu tất cả test case được chạy đều PASS, mã 1 nếu có FAIL, mã 2 nếu không chạy được.
const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');
const { execSync, spawn } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
try { require('dotenv').config({ path: path.join(ROOT, '.env') }); } catch { /* chưa cài thư viện: dùng biến môi trường có sẵn */ }
const { cases } = require('./tc/cases');

let API = (process.env.API_URL || 'http://localhost:3000/api').replace(/\/$/, '');
const PASSWORD = process.env.DEMO_PASSWORD || 'demo123';
const args = process.argv.slice(2);
const gon = args.includes('--gon');
const dungSan = args.includes('--dung-backend-dang-chay');
const say = (...a) => { if (!gon) console.log(...a); };
const ghi = (args.find((a) => a.startsWith('--ghi=')) || '').split('=')[1];
const all = args.includes('--tat-ca');
const wanted = args.filter((a) => /^TC-\d+$/i.test(a)).map((a) => a.toUpperCase());

const cut = (s, n = 150) => (s.length > n ? s.slice(0, n) + '…' : s);
const line = (c = '─') => c.repeat(100);
const git = (cmd) => { try { return execSync(`git ${cmd}`, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return '?'; } };

async function http(method, p, token, body) {
  const res = await fetch(API + p, {
    method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(20000),
  });
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch { /* không phải JSON */ }
  return { status: res.status, json, text };
}

function makeCtx(evidence) {
  const ctx = {
    evidence,
    log: (s) => { evidence.push(s); say(s); },
    async api(method, p, token, body, label) {
      const r = await http(method, p, token, body);
      ctx.log(`  → ${method} ${p}${label ? `   [${label}]` : ''}${body !== undefined ? '\n      gửi: ' + cut(JSON.stringify(body)) : ''}`);
      ctx.log(`  ← HTTP ${r.status}  ${cut(r.text.replace(/\s+/g, ' '))}`);
      return r;
    },
  };
  return ctx;
}

async function prepare() {
  let m, h, l;
  try {
    const login = async (u) => { const r = await http('POST', '/auth/login', null, { username: u, password: PASSWORD }); if (r.status !== 200) throw new Error(`Đăng nhập ${u} thất bại (HTTP ${r.status})`); return r.json; };
    [m, h, l] = [await login('dieu.phoi'), await login('ktv.hai'), await login('ktv.long')];
  } catch (e) {
    if (e.cause || /fetch failed/i.test(e.message)) {
      console.error(`\nKHÔNG GỌI ĐƯỢC BACKEND tại ${API}.\nHãy mở một terminal KHÁC và chạy:  npm start   (chờ thấy dòng "listening"), rồi chạy lại lệnh này.\n`);
      process.exit(2);
    }
    throw e;
  }
  const techs = await http('GET', '/technicians', m.token);
  const hai = techs.json.data.find((t) => t.technician_id === h.user.technicianId);
  return { manager: m.token, haiToken: h.token, longToken: l.token, hai: h.user, long: l.user, centerId: hai.center_id };
}

async function runOne(c, base) {
  const evidence = [];
  const ctx = Object.assign(makeCtx(evidence), base);
  const head = `${c.id}  |  ${c.type}  |  Ưu tiên: ${c.priority}`;
  say('\n' + line('═'));
  say(head);
  say(`Mô tả      : ${c.title}`);
  say(`Dữ liệu vào: ${c.input}`);
  say(`Mong đợi   : ${c.expected}`);
  say(line());
  let res;
  try { res = await c.run(ctx); } catch (e) { res = { pass: false, actual: `Lỗi khi chạy: ${e.message}` }; }
  say(line());
  say(`Thực tế    : ${res.actual}`);
  say(`KẾT QUẢ    : ${res.pass ? 'PASS ✔' : 'FAIL ✘'}`);
  say(line('═'));
  return { id: c.id, type: c.type, priority: c.priority, title: c.title, input: c.input, expected: c.expected, bug: c.bug,
    actual: res.actual, pass: !!res.pass, evidence, runAt: new Date().toISOString() };
}

let temp = null;
const stopTemp = () => { if (temp && !temp.killed) temp.kill(); };
process.on('exit', stopTemp);
process.on('SIGINT', () => { stopTemp(); process.exit(130); });

async function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.once('error', reject);
    srv.listen(0, () => { const { port } = srv.address(); srv.close(() => resolve(port)); });
  });
}

/** Bật backend tạm từ mã nguồn hiện tại; trả về khi /api/health trả 200 (tối đa 25 giây). */
async function startTemp() {
  const port = await freePort();
  let err = '';
  temp = spawn(process.execPath, [path.join(ROOT, 'src', 'backend', 'index.js')], {
    cwd: ROOT, env: { ...process.env, PORT: String(port), AUTH_SECRET: process.env.AUTH_SECRET || 'tc-secret-tam' }, stdio: ['ignore', 'ignore', 'pipe'],
  });
  temp.stderr.on('data', (d) => { err += d; });
  let exited = false; temp.on('exit', () => { exited = true; });
  API = `http://localhost:${port}/api`;
  for (let i = 0; i < 50; i++) {
    if (exited) break;
    try { const r = await fetch(`${API}/health`, { signal: AbortSignal.timeout(3000) }); if (r.status === 200) return; } catch { /* chưa lên */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  console.error('\nKhông bật được backend tạm. Thông báo lỗi:\n' + (err.trim().split('\n').slice(-6).join('\n') || '(không có)') +
    '\nKiểm tra file .env (DB_PASSWORD...) và PostgreSQL đã chạy chưa.\n');
  process.exit(2);
}

async function donDep() {
  const { pool } = require(path.join(ROOT, 'src', 'backend', 'src', 'db'));
  try {
    const sub = "SELECT ticket_id FROM ticket WHERE issue_description = 'TC-AUTO'";
    const a = await pool.query(`DELETE FROM appointment WHERE ticket_id IN (${sub})`);
    const l = await pool.query(`DELETE FROM ticket_log WHERE ticket_id IN (${sub})`);
    const t = await pool.query("DELETE FROM ticket WHERE issue_description = 'TC-AUTO'");
    console.log(`Đã xóa phiếu thử: ${t.rowCount} phiếu, ${l.rowCount} dòng lịch sử, ${a.rowCount} lịch hẹn. Dữ liệu seed và dữ liệu của em không bị đụng tới.`);
  } finally { await pool.end(); }
}

(async () => {
  if (args.includes('--don-dep')) { await donDep(); return; }
  if (!all && !wanted.length) {
    console.log('Dùng:  node scripts/chay-test-case.js TC-05   |   node scripts/chay-test-case.js --tat-ca   [--ghi=truoc|sau]');
    process.exit(0);
  }
  const pick = all ? cases : cases.filter((c) => wanted.includes(c.id));
  if (!pick.length) { console.error('Không có test case nào khớp. Các mã hợp lệ: ' + cases.map((c) => c.id).join(', ')); process.exit(1); }
  console.log(`Phiên bản mã nguồn : ${git('rev-parse --abbrev-ref HEAD')} @ ${git('log -1 --format="%h %s"')}`);
  if (!dungSan) await startTemp();
  console.log(`Backend            : ${API}${dungSan ? '' : '   (bản tạm khởi chạy từ mã nguồn hiện tại, tự tắt khi xong)'}`);
  console.log(`Thời điểm chạy     : ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`);
  const base = await prepare();
  const results = [];
  for (const c of pick) results.push(await runOne(c, base));

  if (ghi) {
    const dir = path.join(ROOT, 'docs', 'ket-qua-chay', 'tc');
    fs.mkdirSync(dir, { recursive: true });
    for (const r of results) fs.writeFileSync(path.join(dir, `${r.id}.${ghi}.json`), JSON.stringify(r, null, 2) + '\n');
    console.log(`\nĐã lưu ${results.length} kết quả vào docs/ket-qua-chay/tc/*.${ghi}.json`);
  }
  if (results.length > 1) {
    console.log('\nTỔNG HỢP');
    console.log(line());
    for (const r of results) console.log(`${r.pass ? 'PASS ✔' : 'FAIL ✘'}  ${r.id}  ${r.type.padEnd(30)} ${r.priority}`);
    console.log(line());
    const p = results.filter((r) => r.pass).length;
    console.log(`Đạt ${p}/${results.length}   |   Không đạt ${results.length - p}`);
  }
  process.exit(results.every((r) => r.pass) ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
