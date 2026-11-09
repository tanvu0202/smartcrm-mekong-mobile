// BUG-07 trên PostgreSQL thật: đổi KTV sang người đã có lịch trùng giờ bị chặn; huỷ lịch kia thì đổi được.
const test = require('node:test');
const assert = require('node:assert/strict');
const h = require('./helpers');

const slot = (s, e) => ({ type: 'GIAO', startTime: `2031-03-01T${s}:00Z`, endTime: `2031-03-01T${e}:00Z` });

test('đổi KTV sang người có lịch trùng: 409 và phiếu giữ KTV cũ; huỷ lịch trùng rồi đổi được', { skip: !h.enabled && 'cần TEST_DATABASE_URL' }, async (t) => {
  const { pool, service } = h.load();
  const c = await h.makeCenter(pool, 'REASSIGN');
  t.after(async () => { await h.cleanup(pool, c); await pool.end(); });
  const techA = await h.makeTech(pool, c);
  const techB = await h.makeTech(pool, c);
  const t1 = await service.create(h.ticketInput(c));
  const t2 = await service.create(h.ticketInput(c));
  await service.assign(t1.ticket_id, { technicianId: techA, changedBy: 'test' });
  await service.assign(t2.ticket_id, { technicianId: techB, changedBy: 'test' });
  await service.createAppointment(t1.ticket_id, slot('09:00', '10:00'));
  const b = await service.createAppointment(t2.ticket_id, slot('09:30', '10:30'));

  await assert.rejects(
    service.reassign(t1.ticket_id, { technicianId: techB, reason: 'thử trùng lịch', changedBy: 'test' }),
    (e) => e.status === 409 && e.code === 'APPOINTMENT_OVERLAP');
  assert.equal((await service.get(t1.ticket_id)).technician_id, techA);

  await service.cancelAppointment(b.appointment_id);
  const r = await service.reassign(t1.ticket_id, { technicianId: techB, reason: 'đã huỷ lịch trùng', changedBy: 'test' });
  assert.equal(r.ticket.technician_id, techB);
});
