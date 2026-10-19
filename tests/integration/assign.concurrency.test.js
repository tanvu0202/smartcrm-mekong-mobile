// Hai yêu cầu phân công ĐỒNG THỜI cho cùng một phiếu (ngoại lệ 5b của UC01 / QT-02).
// Mong đợi: đúng 1 yêu cầu thành công; yêu cầu còn lại bị 409 TICKET_ALREADY_ASSIGNED;
// ticket_log chỉ có 1 bản ghi PHAN_CONG; phiếu chỉ gắn với đúng 1 KTV (người thắng).
const test = require('node:test');
const assert = require('node:assert/strict');
const h = require('./helpers');

test('2 yêu cầu phân công đồng thời: 1 thành công, 1 bị 409, log đúng 1 dòng', { skip: !h.enabled && 'cần TEST_DATABASE_URL' }, async (t) => {
  const { pool, service } = h.load();
  const c = await h.makeCenter(pool, 'CONC');
  t.after(async () => { await h.cleanup(pool, c); await pool.end(); });
  const a = await h.makeTech(pool, c, { skills: { MAN_HINH: 5 } });
  const b = await h.makeTech(pool, c, { skills: { MAN_HINH: 4 } });
  const ticket = await service.create(h.ticketInput(c));

  const results = await Promise.allSettled([
    service.assign(ticket.ticket_id, { technicianId: a, changedBy: 'quan.ly.1' }),
    service.assign(ticket.ticket_id, { technicianId: b, changedBy: 'quan.ly.2' }),
  ]);

  const ok = results.filter((r) => r.status === 'fulfilled');
  const failed = results.filter((r) => r.status === 'rejected');
  assert.equal(ok.length, 1, 'đúng một yêu cầu thành công');
  assert.equal(failed.length, 1);
  assert.equal(failed[0].reason.status, 409);
  assert.equal(failed[0].reason.code, 'TICKET_ALREADY_ASSIGNED');

  const winner = ok[0].value.ticket.technician_id;
  const final = await service.get(ticket.ticket_id);
  assert.equal(final.technician_id, winner);
  assert.equal(final.status, 'DA_PHAN_CONG');
  const history = await service.history(ticket.ticket_id);
  assert.equal(history.length, 1, 'yêu cầu thua không để lại log');
  assert.equal(history[0].action, 'PHAN_CONG');
  assert.equal(history[0].new_technician_id, winner);
});

test('2 yêu cầu ĐỔI KTV đồng thời cho cùng một phiếu: kết quả cuối nhất quán, log khớp', { skip: !h.enabled && 'cần TEST_DATABASE_URL' }, async (t) => {
  const { pool, service } = h.load();
  const c = await h.makeCenter(pool, 'CONC2');
  t.after(async () => { await h.cleanup(pool, c); await pool.end(); });
  const a = await h.makeTech(pool, c, { skills: { MAN_HINH: 5 } });
  const b = await h.makeTech(pool, c, { skills: { MAN_HINH: 4 } });
  const d = await h.makeTech(pool, c, { skills: { MAN_HINH: 3 } });
  const ticket = await service.create(h.ticketInput(c));
  await service.assign(ticket.ticket_id, { technicianId: a, changedBy: 'ql' });

  const res = await Promise.allSettled([
    service.reassign(ticket.ticket_id, { technicianId: b, reason: 'cần gấp', changedBy: 'ql1' }),
    service.reassign(ticket.ticket_id, { technicianId: d, reason: 'cần gấp', changedBy: 'ql2' }),
  ]);
  assert.equal(res.filter((r) => r.status === 'fulfilled').length, 2, 'đổi tuần tự nhờ khóa dòng, cả hai hợp lệ');
  const final = await service.get(ticket.ticket_id);
  const history = await service.history(ticket.ticket_id);
  assert.equal(history.length, 3);
  // Chuỗi log phải liền mạch: new_technician_id của dòng trước = old_technician_id của dòng sau
  for (let i = 1; i < history.length; i++) assert.equal(history[i].old_technician_id, history[i - 1].new_technician_id);
  assert.equal(final.technician_id, history[2].new_technician_id);
});
