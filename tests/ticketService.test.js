const test = require('node:test');
const assert = require('node:assert/strict');
const { createTicketService } = require('../src/backend/src/services/ticketService');

function setup({ ticket, tech, open = 0 } = {}) {
  const state = { ticket: ticket && { ...ticket }, logs: [], tx: 0 };
  const ticketRepo = {
    findById: async () => (state.ticket ? { ...state.ticket } : null),
    countOpenByTechnician: async () => open,
    setAssignment: async (_c, _id, techId, status) => Object.assign(state.ticket, { technician_id: techId, status }),
    nextCode: async () => 'BH-0100',
    insert: async (_c, t) => ({ ticket_id: 9, ticket_code: t.ticketCode, status: 'MOI' }),
    updateInfo: async (_c, _id, t) => ({ ...state.ticket, ...t }),
    remove: async () => true,
    findAll: async () => [],
  };
  const technicianRepo = {
    findById: async () => tech || null,
    findCandidates: async () => [
      { technician_id: 1, proficiency: 5, open_tickets: 2 },
      { technician_id: 2, proficiency: 4, open_tickets: 12 }],
  };
  const logRepo = { insert: async (_c, l) => { state.logs.push(l); return l; }, findByTicket: async () => state.logs };
  const withTransaction = async (fn) => { state.tx++; return fn({}); };
  const svc = createTicketService({ ticketRepo, technicianRepo, logRepo, db: {}, withTransaction, config: {} });
  return { svc, state };
}
const T = (o = {}) => ({ ticket_id: 1, center_id: 1, technician_id: null, status: 'MOI', issue_group: 'MAN_HINH', ...o });
const K = (o = {}) => ({ technician_id: 5, center_id: 1, full_name: 'A', is_active: true, ...o });
const ok = { changedBy: 'dieu.phoi' };

test('phân công lần đầu: MOI -> DA_PHAN_CONG và ghi log PHAN_CONG (QT-01, NFR05)', async () => {
  const { svc, state } = setup({ ticket: T(), tech: K() });
  const r = await svc.assign(1, { technicianId: 5, ...ok });
  assert.equal(r.ticket.status, 'DA_PHAN_CONG');
  assert.equal(state.logs[0].action, 'PHAN_CONG');
  assert.equal(state.tx, 1);
});

test('KTV khác trung tâm bị từ chối 422 (QT-03)', async () => {
  const { svc } = setup({ ticket: T(), tech: K({ center_id: 2 }) });
  await assert.rejects(svc.assign(1, { technicianId: 5, ...ok }), { status: 422, code: 'TECH_OTHER_CENTER' });
});

test('gán lại đúng KTV hiện tại bị 409 (QT-02)', async () => {
  const { svc } = setup({ ticket: T({ technician_id: 5, status: 'DA_PHAN_CONG' }), tech: K() });
  await assert.rejects(svc.reassign(1, { technicianId: 5, reason: 'x', ...ok }), { status: 409, code: 'ALREADY_ASSIGNED' });
});

test('đổi KTV không có lý do bị 400 (QT-04)', async () => {
  const { svc } = setup({ ticket: T({ technician_id: 6, status: 'DA_PHAN_CONG' }), tech: K() });
  await assert.rejects(svc.reassign(1, { technicianId: 5, ...ok }), { status: 400 });
});

test('đổi KTV phiếu DANG_XU_LY cần confirm=true (QT-04)', async () => {
  const { svc, state } = setup({ ticket: T({ technician_id: 6, status: 'DANG_XU_LY' }), tech: K() });
  await assert.rejects(svc.reassign(1, { technicianId: 5, reason: 'KTV nghỉ ốm', ...ok }), { code: 'CONFIRM_REQUIRED' });
  const r = await svc.reassign(1, { technicianId: 5, reason: 'KTV nghỉ ốm', confirm: true, ...ok });
  assert.equal(r.ticket.status, 'DANG_XU_LY');
  assert.equal(state.logs[0].action, 'DOI_KTV');
  assert.equal(state.logs[0].oldTechnicianId, 6);
});

test('phiếu HOAN_TAT không phân công được (QT-01)', async () => {
  const { svc } = setup({ ticket: T({ status: 'HOAN_TAT', technician_id: 6 }), tech: K() });
  await assert.rejects(svc.reassign(1, { technicianId: 5, reason: 'x', ...ok }), { code: 'TICKET_CLOSED' });
});

test('KTV đã có 9 phiếu mở: vẫn gán được nhưng có cảnh báo (QT-06)', async () => {
  const { svc } = setup({ ticket: T(), tech: K(), open: 9 });
  const r = await svc.assign(1, { technicianId: 5, ...ok });
  assert.equal(r.warnings[0].code, 'TECH_OVERLOADED');
});

test('KTV có 3 phiếu mở: không cảnh báo', async () => {
  const { svc } = setup({ ticket: T(), tech: K(), open: 3 });
  assert.equal((await svc.assign(1, { technicianId: 5, ...ok })).warnings.length, 0);
});

test('phiếu không tồn tại -> 404', async () => {
  const { svc } = setup({});
  await assert.rejects(svc.get(99), { status: 404 });
});

test('đề xuất đánh dấu overloaded theo ngưỡng 10', async () => {
  const { svc } = setup({ ticket: T() });
  const r = await svc.suggest(1);
  assert.deepEqual(r.map((x) => x.overloaded), [false, true]);
});

test('tạo phiếu thiếu trường / sai priority -> 400', async () => {
  const { svc } = setup({});
  await assert.rejects(svc.create({ customerName: 'A' }), { status: 400 });
  await assert.rejects(svc.create({ centerId: 1, customerName: 'A', customerPhone: '0912000001', deviceModel: 'X',
    issueGroup: 'PIN', priority: 7, dueDate: '2026-12-01T00:00:00Z' }), { status: 400 });
});

test('tạo phiếu hợp lệ sinh mã BH-xxxx', async () => {
  const { svc } = setup({});
  const r = await svc.create({ centerId: 1, customerName: 'A', customerPhone: '0912000001', deviceModel: 'X',
    issueGroup: 'PIN', priority: 2, dueDate: '2026-12-01T00:00:00Z' });
  assert.equal(r.ticket_code, 'BH-0100');
});

test('chỉ sửa/xóa được phiếu MOI', async () => {
  const { svc } = setup({ ticket: T({ status: 'DA_PHAN_CONG', technician_id: 5 }) });
  await assert.rejects(svc.remove(1), { code: 'TICKET_NOT_DELETABLE' });
  await assert.rejects(svc.update(1, { customerName: 'A', customerPhone: '0912000001', deviceModel: 'X',
    issueGroup: 'PIN', priority: 2, dueDate: '2026-12-01T00:00:00Z' }), { code: 'TICKET_NOT_EDITABLE' });
});

test('phân công lần đầu cho phiếu đã có KTV -> 409 TICKET_ALREADY_ASSIGNED (UC01 5b)', async () => {
  const { svc, state } = setup({ ticket: T({ technician_id: 6, status: 'DA_PHAN_CONG' }), tech: K() });
  await assert.rejects(svc.assign(1, { technicianId: 5, ...ok }), { status: 409, code: 'TICKET_ALREADY_ASSIGNED' });
  assert.equal(state.logs.length, 0);
});

test('đổi KTV cho phiếu chưa có KTV -> 409 TICKET_NOT_ASSIGNED', async () => {
  const { svc } = setup({ ticket: T(), tech: K() });
  await assert.rejects(svc.reassign(1, { technicianId: 5, reason: 'x', ...ok }), { code: 'TICKET_NOT_ASSIGNED' });
});
