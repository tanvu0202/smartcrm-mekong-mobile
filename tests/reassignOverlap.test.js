// BUG-07: đổi kỹ thuật viên không được tạo ra hai lịch trùng giờ cho cùng một người (QT-05). Unit test, repository giả.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createTicketService } = require('../src/backend/src/services/ticketService');

const at = (h, m = 0) => new Date(Date.UTC(2030, 4, 1, h, m));

/** busy: lịch sẵn có của KTV mới; mine: lịch của chính phiếu đang được đổi KTV. */
function setup({ busy = [], mine = [] } = {}) {
  const state = { ticket: { ticket_id: 1, center_id: 1, technician_id: 5, status: 'DA_PHAN_CONG' }, logs: [], assigned: [] };
  const service = createTicketService({
    ticketRepo: {
      findById: async () => ({ ...state.ticket }),
      countOpenByTechnician: async () => 0,
      setAssignment: async (_c, _id, techId, status) => { state.assigned.push(techId); return Object.assign(state.ticket, { technician_id: techId, status }); },
    },
    technicianRepo: { findById: async () => ({ technician_id: 6, center_id: 1, full_name: 'KTV mới', is_active: true }) },
    logRepo: { insert: async (_c, l) => { state.logs.push(l); return l; } },
    appointmentRepo: {
      findByTicket: async () => mine.map((a) => ({ start_time: a[0], end_time: a[1] })),
      // cùng điều kiện với câu SQL thật: start_cũ < end_mới AND end_cũ > start_mới
      findOverlap: async (_c, _tech, s, e) => busy.find((b) => b[0] < e && b[1] > s) ? { appointment_id: 99, ticket_id: 2 } : null,
    },
    db: {}, withTransaction: async (fn) => fn({}), config: {},
  });
  return { service, state };
}
const input = { technicianId: 6, reason: 'KTV cũ nghỉ ốm', changedBy: 'dieu.phoi' };

test('BUG-07: đổi KTV sang người đã có lịch trùng giờ -> 409 APPOINTMENT_OVERLAP, giữ nguyên người cũ', async () => {
  const { service, state } = setup({ busy: [[at(9), at(10)]], mine: [[at(9, 30), at(10, 30)]] });
  await assert.rejects(service.reassign(1, input), (e) => e.status === 409 && e.code === 'APPOINTMENT_OVERLAP');
  assert.equal(state.ticket.technician_id, 5, 'phiếu vẫn thuộc KTV cũ');
  assert.deepEqual(state.assigned, []);
  assert.equal(state.logs.length, 0, 'không ghi lịch sử khi bị từ chối');
});

test('BUG-07 (biên): lịch chỉ chạm đầu mút 10:00 = 10:00 thì vẫn đổi được', async () => {
  const { service, state } = setup({ busy: [[at(9), at(10)]], mine: [[at(10), at(11)]] });
  const r = await service.reassign(1, input);
  assert.equal(r.ticket.technician_id, 6);
  assert.equal(state.logs[0].action, 'DOI_KTV');
});

test('BUG-07: phiếu chưa có lịch hẹn nào thì đổi KTV bình thường', async () => {
  const { service } = setup({ busy: [[at(9), at(10)]], mine: [] });
  assert.equal((await service.reassign(1, input)).ticket.technician_id, 6);
});

test('BUG-07: chỉ một trong nhiều lịch của phiếu trùng cũng bị chặn', async () => {
  const { service } = setup({ busy: [[at(14), at(15)]], mine: [[at(8), at(9)], [at(14, 30), at(16)]] });
  await assert.rejects(service.reassign(1, input), { code: 'APPOINTMENT_OVERLAP' });
});
