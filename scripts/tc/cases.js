// 12 test case của Buổi 14 (BT3). Mỗi case: thông tin mô tả + hàm run(ctx) chạy THẬT vào backend đang chạy (http://localhost:3000/api).
// Mọi phiếu do test case tạo có issueDescription = 'TC-AUTO' để dọn bằng `npm run tc:don-dep`.
// ctx.api(...) gọi API và in "→ yêu cầu / ← phản hồi" ra màn hình (đó chính là minh chứng chụp ảnh).
// run() trả về { pass: true|false, actual: 'mô tả ngắn kết quả thực tế' }.
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.join(__dirname, '..', '..');
const rnd = (a, b) => crypto.randomInt(a, b + 1);
const pad = (n) => String(n).padStart(2, '0');
const phone = () => `09${String(rnd(0, 99999999)).padStart(8, '0')}`;
/** Một ngày ngẫu nhiên rất xa trong tương lai (năm 2100–2249) để mỗi lần chạy không đụng lịch của lần chạy trước. */
const randomDay = () => `${rnd(2100, 2249)}-${pad(rnd(1, 12))}-${pad(rnd(1, 28))}`;
const at = (day, hhmmss) => `${day}T${hhmmss}Z`;

const validTicket = (ctx, over = {}) => ({
  centerId: ctx.centerId, customerName: `TC khach ${rnd(1000, 9999)}`, customerPhone: phone(), deviceModel: 'iPhone 13',
  issueGroup: 'MAN_HINH', priority: 2, issueDescription: 'TC-AUTO', dueDate: new Date(Date.now() + 864e5).toISOString(), ...over,
});

/** Tạo phiếu mới và (tuỳ chọn) phân công cho KTV. Trả về ticket_id. */
async function newTicket(ctx, { techId, over } = {}) {
  const c = await ctx.api('POST', '/tickets', ctx.manager, validTicket(ctx, over), 'Tạo phiếu');
  if (c.status !== 201) throw new Error(`Không tạo được phiếu chuẩn bị (HTTP ${c.status})`);
  const id = c.json.data.ticket_id;
  if (techId) {
    const a = await ctx.api('POST', `/tickets/${id}/assign`, ctx.manager, { technicianId: techId }, 'Phân công');
    if (a.status !== 200) throw new Error(`Không phân công được (HTTP ${a.status})`);
  }
  return id;
}
const appt = (id, ctx, s, e, label) =>
  ctx.api('POST', `/tickets/${id}/appointments`, ctx.manager, { type: 'GIAO', startTime: s, endTime: e }, label || 'Đặt lịch hẹn');

const cases = [
  {
    id: 'TC-01', type: 'Luồng đúng', priority: 'Cao', bug: null,
    title: 'Luồng chính: tạo phiếu → phân công → xử lý → hoàn tất',
    input: 'Phiếu hợp lệ (priority 2, SĐT 10 số); KTV Hải xử lý phiếu của mình',
    expected: 'Phiếu đi MOI → DA_PHAN_CONG → DANG_XU_LY → HOAN_TAT; lịch sử ghi đủ 3 dòng',
    async run(ctx) {
      const id = await newTicket(ctx, { techId: ctx.hai.technicianId });
      const s1 = await ctx.api('POST', `/tickets/${id}/status`, ctx.haiToken, { status: 'DANG_XU_LY' }, 'KTV Hải: bắt đầu xử lý');
      const s2 = await ctx.api('POST', `/tickets/${id}/status`, ctx.haiToken, { status: 'HOAN_TAT' }, 'KTV Hải: hoàn tất');
      const h = await ctx.api('GET', `/tickets/${id}/history`, ctx.manager, undefined, 'Xem lịch sử');
      const n = h.json?.data?.length;
      const pass = s1.status === 200 && s2.status === 200 && s2.json?.ticket?.status === 'HOAN_TAT' && n === 3;
      return { pass, actual: `HTTP ${s1.status}/${s2.status}, trạng thái cuối ${s2.json?.ticket?.status}, lịch sử ${n} dòng` };
    },
  },
  {
    id: 'TC-02', type: 'Luồng đúng', priority: 'Cao', bug: null,
    title: 'Đặt lịch hẹn giao máy cho phiếu đã phân công',
    input: 'Lịch GIAO 09:00–10:00 (giờ UTC 02:00–03:00) cho KTV Hải',
    expected: '201, lịch ở trạng thái DA_DAT và xuất hiện trong danh sách lịch của phiếu',
    async run(ctx) {
      const id = await newTicket(ctx, { techId: ctx.hai.technicianId });
      const day = randomDay();
      const r = await appt(id, ctx, at(day, '02:00:00'), at(day, '03:00:00'));
      const l = await ctx.api('GET', `/tickets/${id}/appointments`, ctx.manager, undefined, 'Xem danh sách lịch');
      const pass = r.status === 201 && r.json?.data?.status === 'DA_DAT' && l.json?.data?.length === 1;
      return { pass, actual: `HTTP ${r.status}, status=${r.json?.data?.status}, số lịch của phiếu=${l.json?.data?.length}` };
    },
  },
  {
    id: 'TC-03', type: 'Biên (phía hợp lệ)', priority: 'Cao', bug: null,
    title: 'Biên QT-05: hai lịch chỉ chạm đầu mút (10:00 = 10:00) KHÔNG bị coi là trùng',
    input: 'Lịch A 02:00–03:00; lịch B 03:00–04:00 (cùng KTV)',
    expected: 'Lịch B được tạo: 201',
    async run(ctx) {
      const a = await newTicket(ctx, { techId: ctx.hai.technicianId });
      const b = await newTicket(ctx, { techId: ctx.hai.technicianId });
      const day = randomDay();
      await appt(a, ctx, at(day, '02:00:00'), at(day, '03:00:00'), 'Đặt lịch A');
      const r = await appt(b, ctx, at(day, '03:00:00'), at(day, '04:00:00'), 'Đặt lịch B (chạm đầu mút)');
      return { pass: r.status === 201, actual: `HTTP ${r.status}` };
    },
  },
  {
    id: 'TC-04', type: 'Biên (phía không hợp lệ)', priority: 'Cao', bug: null,
    title: 'Biên QT-05: lịch chồng lên lịch khác đúng 1 giây thì bị từ chối',
    input: 'Lịch A 02:00:00–03:00:00; lịch B 02:59:59–04:00:00 (cùng KTV)',
    expected: '409 APPOINTMENT_OVERLAP',
    async run(ctx) {
      const a = await newTicket(ctx, { techId: ctx.hai.technicianId });
      const b = await newTicket(ctx, { techId: ctx.hai.technicianId });
      const day = randomDay();
      await appt(a, ctx, at(day, '02:00:00'), at(day, '03:00:00'), 'Đặt lịch A');
      const r = await appt(b, ctx, at(day, '02:59:59'), at(day, '04:00:00'), 'Đặt lịch B (chồng 1 giây)');
      return { pass: r.status === 409 && r.json?.error?.code === 'APPOINTMENT_OVERLAP', actual: `HTTP ${r.status}, code=${r.json?.error?.code}` };
    },
  },
  {
    id: 'TC-05', type: 'Luồng đúng / nghiệp vụ QT-05', priority: 'Cao', bug: 'BUG-07',
    title: 'Đổi kỹ thuật viên sang người đã có lịch trùng giờ phải bị từ chối',
    input: 'Phiếu A (KTV Hải) lịch 02:00–03:00; phiếu B (KTV Long) cũng lịch 02:00–03:00; đổi phiếu A sang Long',
    expected: '409 APPOINTMENT_OVERLAP và phiếu A vẫn thuộc KTV Hải',
    async run(ctx) {
      const a = await newTicket(ctx, { techId: ctx.hai.technicianId });
      const b = await newTicket(ctx, { techId: ctx.long.technicianId });
      const day = randomDay();
      await appt(a, ctx, at(day, '02:00:00'), at(day, '03:00:00'), 'Lịch phiếu A (KTV Hải)');
      await appt(b, ctx, at(day, '02:00:00'), at(day, '03:00:00'), 'Lịch phiếu B (KTV Long)');
      const r = await ctx.api('POST', `/tickets/${a}/reassign`, ctx.manager, { technicianId: ctx.long.technicianId, reason: 'TC-05 doi KTV' }, 'Đổi phiếu A sang KTV Long');
      const t = await ctx.api('GET', `/tickets/${a}`, ctx.manager, undefined, 'Xem lại phiếu A');
      const owner = t.json?.data?.technician_id;
      const pass = r.status === 409 && r.json?.error?.code === 'APPOINTMENT_OVERLAP' && owner === ctx.hai.technicianId;
      return { pass, actual: `HTTP ${r.status}, code=${r.json?.error?.code ?? '(không có lỗi)'}, KTV của phiếu A sau đó = ${owner === ctx.long.technicianId ? 'Long (đã bị đổi!)' : owner === ctx.hai.technicianId ? 'Hải' : owner}` };
    },
  },
  {
    id: 'TC-06', type: 'Dữ liệu sai', priority: 'Cao', bug: 'BUG-08',
    title: 'Ngày không tồn tại (30/02) phải bị từ chối, không được tự đổi sang ngày khác',
    input: 'dueDate = 2027-02-30T10:00:00Z; startTime/endTime của lịch = <năm>-02-30',
    expected: 'Cả hai yêu cầu trả 400 VALIDATION_ERROR',
    async run(ctx) {
      const r1 = await ctx.api('POST', '/tickets', ctx.manager, validTicket(ctx, { dueDate: '2027-02-30T10:00:00Z' }), 'Tạo phiếu với dueDate 30/02');
      const id = await newTicket(ctx, { techId: ctx.hai.technicianId });
      const y = rnd(2100, 2249);
      const r2 = await appt(id, ctx, `${y}-02-30T02:00:00Z`, `${y}-02-30T03:00:00Z`, 'Đặt lịch vào 30/02');
      const shown = [r1.status === 201 ? `phiếu được tạo, dueDate lưu thành ${r1.json?.data?.due_date}` : null,
        r2.status === 201 ? `lịch được tạo, start lưu thành ${r2.json?.data?.start_time}` : null].filter(Boolean).join('; ');
      return { pass: r1.status === 400 && r2.status === 400, actual: `HTTP ${r1.status} / ${r2.status}${shown ? ' – ' + shown : ''}` };
    },
  },
  {
    id: 'TC-07', type: 'Dữ liệu sai', priority: 'Trung bình', bug: 'BUG-09',
    title: 'Tên khách hàng chỉ gồm dấu cách phải bị từ chối',
    input: 'customerName = "     " (5 dấu cách)',
    expected: '400 VALIDATION_ERROR',
    async run(ctx) {
      const r = await ctx.api('POST', '/tickets', ctx.manager, validTicket(ctx, { customerName: '     ' }), 'Tạo phiếu với tên toàn dấu cách');
      const saved = r.json?.data ? `đã lưu customer_name=${JSON.stringify(r.json.data.customer_name)}` : '';
      return { pass: r.status === 400, actual: `HTTP ${r.status} ${saved}`.trim() };
    },
  },
  {
    id: 'TC-08', type: 'Dữ liệu sai / biên', priority: 'Trung bình', bug: 'BUG-10',
    title: 'Số điện thoại: "++++++++" bị từ chối, "+84912345678" được chấp nhận',
    input: 'customerPhone = "++++++++" (8 ký tự) và "+84912345678"',
    expected: 'Yêu cầu 1 → 400; yêu cầu 2 → 201',
    async run(ctx) {
      const bad = await ctx.api('POST', '/tickets', ctx.manager, validTicket(ctx, { customerPhone: '++++++++' }), 'SĐT toàn dấu +');
      const good = await ctx.api('POST', '/tickets', ctx.manager, validTicket(ctx, { customerPhone: '+84912345678' }), 'SĐT đúng định dạng quốc tế');
      return { pass: bad.status === 400 && good.status === 201, actual: `"++++++++" → HTTP ${bad.status}; "+84912345678" → HTTP ${good.status}` };
    },
  },
  {
    id: 'TC-09', type: 'Bảo mật (phân quyền)', priority: 'Cao', bug: null,
    title: 'Không đăng nhập / sai vai trò đều bị chặn',
    input: 'Không token; KTV Hải xem phiếu của KTV Long; KTV Hải thử phân công; KTV Hải đổi trạng thái phiếu người khác',
    expected: '401, 403, 403, 403',
    async run(ctx) {
      const id = await newTicket(ctx, { techId: ctx.long.technicianId });
      const r1 = await ctx.api('GET', '/tickets', null, undefined, 'Không token: xem danh sách');
      const r2 = await ctx.api('GET', `/tickets/${id}`, ctx.haiToken, undefined, 'KTV Hải xem phiếu của Long');
      const r3 = await ctx.api('POST', `/tickets/${id}/assign`, ctx.haiToken, { technicianId: ctx.hai.technicianId }, 'KTV Hải tự phân công');
      const r4 = await ctx.api('POST', `/tickets/${id}/status`, ctx.haiToken, { status: 'DANG_XU_LY' }, 'KTV Hải đổi trạng thái phiếu của Long');
      const got = [r1.status, r2.status, r3.status, r4.status];
      return { pass: got.join() === '401,403,403,403', actual: `HTTP ${got.join(', ')}` };
    },
  },
  {
    id: 'TC-10', type: 'Bảo mật / chất lượng dữ liệu', priority: 'Cao', bug: null,
    title: 'Chuỗi kiểu SQL injection được lưu nguyên văn, bảng không bị ảnh hưởng',
    input: `customerName = "Robert'); DROP TABLE ticket;--"`,
    expected: '201; đọc lại đúng nguyên văn; danh sách phiếu vẫn truy vấn được',
    async run(ctx) {
      const evil = "Robert'); DROP TABLE ticket;--";
      const c = await ctx.api('POST', '/tickets', ctx.manager, validTicket(ctx, { customerName: evil }), 'Tạo phiếu với chuỗi độc');
      const g = c.status === 201 ? await ctx.api('GET', `/tickets/${c.json.data.ticket_id}`, ctx.manager, undefined, 'Đọc lại phiếu') : { json: null, status: '-' };
      const l = await ctx.api('GET', '/tickets', ctx.manager, undefined, 'Danh sách phiếu vẫn truy vấn được?');
      const same = g.json?.data?.customer_name === evil;
      return { pass: c.status === 201 && same && l.status === 200, actual: `HTTP ${c.status}, lưu đúng nguyên văn=${same}, danh sách HTTP ${l.status}` };
    },
  },
  {
    id: 'TC-11', type: 'Biên (2 phía)', priority: 'Trung bình', bug: 'BUG-11',
    title: 'Độ dài tên khách hàng: 100 ký tự được chấp nhận, 101 ký tự bị từ chối (cột VARCHAR(100))',
    input: 'customerName 100 ký tự, rồi 101 ký tự',
    expected: '100 ký tự → 201; 101 ký tự → 400 VALIDATION_ERROR (không phải 500)',
    async run(ctx) {
      const ok = await ctx.api('POST', '/tickets', ctx.manager, validTicket(ctx, { customerName: 'N'.repeat(100) }), 'Tên 100 ký tự');
      const over = await ctx.api('POST', '/tickets', ctx.manager, validTicket(ctx, { customerName: 'N'.repeat(101) }), 'Tên 101 ký tự');
      return { pass: ok.status === 201 && over.status === 400, actual: `100 ký tự → HTTP ${ok.status}; 101 ký tự → HTTP ${over.status}${over.json?.error?.code ? ' ' + over.json.error.code : ''}` };
    },
  },
  {
    id: 'TC-12', type: 'Tái lập', priority: 'Trung bình', bug: null,
    title: 'Chạy lại migration và seed lần 2 không nhân đôi dữ liệu',
    input: 'npm run migrate (lần 2) rồi chạy lại 002_seed_catalog.sql; so số dòng trước/sau',
    expected: 'Migration báo "bỏ qua" cả 3 file, thoát mã 0; số dòng các bảng danh mục không đổi',
    async run(ctx) {
      require('dotenv').config({ path: path.join(ROOT, '.env') });
      const { pool } = require(path.join(ROOT, 'src/backend/src/db'));
      const count = async () => {
        const q = async (sql) => (await pool.query(sql)).rows[0].n;
        return {
          service_center: await q('SELECT count(*)::int AS n FROM service_center'),
          technician: await q('SELECT count(*)::int AS n FROM technician'),
          technician_skill: await q('SELECT count(*)::int AS n FROM technician_skill'),
          'ticket BH-0001..0003': await q("SELECT count(*)::int AS n FROM ticket WHERE ticket_code IN ('BH-0001','BH-0002','BH-0003')"),
        };
      };
      try {
        const before = await count();
        ctx.log(`Số dòng TRƯỚC : ${JSON.stringify(before)}`);
        ctx.log('$ npm run migrate   (lần chạy thứ 2)');
        let out = ''; let code = 0;
        try { out = execFileSync(process.execPath, [path.join(ROOT, 'src/backend/scripts/migrate.js')], { cwd: ROOT, encoding: 'utf8' }); }
        catch (e) { out = String(e.stdout || '') + String(e.stderr || ''); code = e.status || 1; }
        out.trim().split('\n').forEach((l) => ctx.log('  ' + l));
        ctx.log(`  (mã thoát ${code})`);
        const skipped = (out.match(/bỏ qua/g) || []).length;
        ctx.log('$ chạy lại 002_seed_catalog.sql');
        await pool.query(require('node:fs').readFileSync(path.join(ROOT, 'db/migrations/002_seed_catalog.sql'), 'utf8'));
        const after = await count();
        ctx.log(`Số dòng SAU   : ${JSON.stringify(after)}`);
        const same = JSON.stringify(before) === JSON.stringify(after);
        return { pass: code === 0 && skipped >= 3 && same, actual: `migrate: ${skipped} file "bỏ qua", mã thoát ${code}; số dòng ${same ? 'không đổi' : 'THAY ĐỔI'}` };
      } finally { await pool.end(); }
    },
  },
];

module.exports = { cases };
