// QT-05 trên PostgreSQL thật: câu SQL kiểm tra trùng lịch và hai lần đặt đồng thời cho cùng một kỹ thuật viên.
const test = require('node:test');
const assert = require('node:assert/strict');
const h = require('./helpers');

async function setupAssigned(pool, service, tag) {
  const c = await h.makeCenter(pool, tag);
  const tech = await h.makeTech(pool, c, { skills: { MAN_HINH: 5 } });
  const t1 = await service.create(h.ticketInput(c));
  const t2 = await service.create(h.ticketInput(c));
  await service.assign(t1.ticket_id, { technicianId: tech, changedBy: 'test' });
  await service.assign(t2.ticket_id, { technicianId: tech, changedBy: 'test' });
  return { c, tech, t1: t1.ticket_id, t2: t2.ticket_id };
}
const slot = (s, e) => ({ type: 'GIAO', startTime: `2026-11-01T${s}:00Z`, endTime: `2026-11-01T${e}:00Z` });

test('lịch hẹn: trùng giờ giữa HAI PHIẾU của cùng kỹ thuật viên bị chặn, chạm đầu mút thì được', { skip: !h.enabled && 'cần TEST_DATABASE_URL' }, async (t) => {
  const { pool, service } = h.load();
  const x = await setupAssigned(pool, service, 'APPT');
  t.after(async () => { await h.cleanup(pool, x.c); await pool.end(); });

  await service.createAppointment(x.t1, slot('09:00', '10:00'));
  await assert.rejects(service.createAppointment(x.t2, slot('09:30', '10:30')), (e) => e.status === 409 && e.code === 'APPOINTMENT_OVERLAP');
  await service.createAppointment(x.t2, slot('10:00', '11:00'));
  assert.equal((await service.listAppointments(x.t1)).length, 1);
  assert.equal((await service.listAppointments(x.t2)).length, 1);
});

test('lịch hẹn: 2 yêu cầu đặt ĐỒNG THỜI cùng khung giờ cho một kỹ thuật viên: đúng 1 thành công', { skip: !h.enabled && 'cần TEST_DATABASE_URL' }, async (t) => {
  const { pool, service } = h.load();
  const x = await setupAssigned(pool, service, 'APPT2');
  t.after(async () => { await h.cleanup(pool, x.c); await pool.end(); });

  const results = await Promise.allSettled([
    service.createAppointment(x.t1, slot('14:00', '15:00')),
    service.createAppointment(x.t2, slot('14:00', '15:00')),
  ]);
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1, 'đúng một yêu cầu thành công');
  const failed = results.find((r) => r.status === 'rejected');
  assert.equal(failed.reason.code, 'APPOINTMENT_OVERLAP');
  const { rows } = await pool.query(
    'SELECT count(*)::int AS n FROM appointment WHERE ticket_id IN ($1, $2)', [x.t1, x.t2]);
  assert.equal(rows[0].n, 1);
});

test('trạng thái: vòng đời đầy đủ trên CSDL thật và log ghi đúng', { skip: !h.enabled && 'cần TEST_DATABASE_URL' }, async (t) => {
  const { pool, service } = h.load();
  const x = await setupAssigned(pool, service, 'STAT');
  t.after(async () => { await h.cleanup(pool, x.c); await pool.end(); });

  await assert.rejects(service.changeStatus(x.t1, { status: 'HOAN_TAT', changedBy: 'ktv' }), (e) => e.code === 'STATUS_SKIP');
  await service.changeStatus(x.t1, { status: 'DANG_XU_LY', changedBy: 'ktv' });
  await service.changeStatus(x.t1, { status: 'HOAN_TAT', changedBy: 'ktv' });
  const log = await service.history(x.t1);
  assert.deepEqual(log.map((l) => l.action), ['PHAN_CONG', 'DOI_TRANG_THAI', 'DOI_TRANG_THAI']);
  assert.equal((await service.get(x.t1)).status, 'HOAN_TAT');
});

// ---- CRUD lịch hẹn trên PostgreSQL thật (đọc, sửa, hủy, đặt lại sau khi hủy) ----
test('CRUD lịch hẹn: sửa bỏ qua chính nó, trùng lịch khác thì 409, hủy là xóa mềm rồi đặt lại đúng khung được', { skip: !h.enabled && 'cần TEST_DATABASE_URL' }, async (t) => {
  const { pool, service } = h.load();
  const x = await setupAssigned(pool, service, 'CRUD');
  t.after(async () => { await h.cleanup(pool, x.c); await pool.end(); });

  const a1 = await service.createAppointment(x.t1, slot('09:00', '10:00'));
  const a2 = await service.createAppointment(x.t2, slot('11:00', '12:00'));
  assert.equal((await service.getAppointment(a1.appointment_id)).appointment_type, 'GIAO');

  const moved = await service.updateAppointment(a1.appointment_id, { type: 'NHAN', startTime: '2026-11-01T09:30:00Z', endTime: '2026-11-01T10:30:00Z' });
  assert.equal(moved.appointment_type, 'NHAN', 'dời chồng một phần lên chính nó vẫn được');
  await assert.rejects(service.updateAppointment(a1.appointment_id, slot('10:30', '11:30')), (e) => e.code === 'APPOINTMENT_OVERLAP');

  await service.cancelAppointment(a2.appointment_id);
  assert.equal((await service.getAppointment(a2.appointment_id)).status, 'DA_HUY');
  await assert.rejects(service.cancelAppointment(a2.appointment_id), (e) => e.code === 'APPOINTMENT_CANCELLED');
  const again = await service.createAppointment(x.t2, slot('11:00', '12:00')); // cùng phiếu, cùng loại, cùng giờ với lịch đã hủy
  assert.notEqual(again.appointment_id, a2.appointment_id, 'đặt lại thành lịch mới (ràng buộc duy nhất chỉ tính lịch còn hiệu lực)');
});
