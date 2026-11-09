// BUG-06 trên PostgreSQL thật: lịch sử thay đổi phải theo thứ tự GHI, không theo giờ bắt đầu transaction.
// Dựng đúng tình huống gây lỗi một cách tất định: transaction B bắt đầu TRƯỚC (now() sớm hơn) nhưng ghi và commit SAU transaction A.
const test = require('node:test');
const assert = require('node:assert/strict');
const h = require('./helpers');
const logRepo = require('../../src/backend/src/repositories/ticketLogRepository');

test('lịch sử xếp theo thứ tự ghi, kể cả khi transaction ghi sau lại bắt đầu sớm hơn', { skip: !h.enabled && 'cần TEST_DATABASE_URL' }, async (t) => {
  const { pool, service } = h.load();
  const c = await h.makeCenter(pool, 'HISTORY');
  t.after(async () => { await h.cleanup(pool, c); await pool.end(); });
  const tech = await h.makeTech(pool, c);
  const ticket = await service.create(h.ticketInput(c));
  const id = ticket.ticket_id;

  const b = await pool.connect();
  try {
    await b.query('BEGIN');                              // now() của B được chốt tại đây
    await b.query('SELECT 1');
    await new Promise((r) => setTimeout(r, 30));
    await logRepo.insert(pool, { ticketId: id, action: 'PHAN_CONG', newTechnicianId: tech, newStatus: 'DA_PHAN_CONG', changedBy: 'ghi-truoc' }); // A ghi và commit trước
    await logRepo.insert(b, { ticketId: id, action: 'DOI_TRANG_THAI', oldTechnicianId: tech, newTechnicianId: tech, oldStatus: 'DA_PHAN_CONG', newStatus: 'DANG_XU_LY', changedBy: 'ghi-sau' });
    await b.query('COMMIT');
  } finally { b.release(); }

  const history = await service.history(id);
  assert.deepEqual(history.map((l) => l.changed_by), ['ghi-truoc', 'ghi-sau']);
});
