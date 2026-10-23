// Kiểm thử QT-05 (lịch hẹn không trùng) và QT-01 (vòng đời trạng thái) ở lớp nghiệp vụ, dùng repository giả.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createTicketService } = require('../src/backend/src/services/ticketService');

function setup({ ticket, appointments = [] } = {}) {
  const state = { ticket: ticket && { ...ticket }, logs: [], appts: appointments.map((a) => ({ ...a })) };
  const ticketRepo = {
    findById: async () => (state.ticket ? { ...state.ticket } : null),
    setStatus: async (_c, _id, status) => Object.assign(state.ticket, { status }),
  };
  const technicianRepo = { findById: async () => ({ technician_id: 5, center_id: 1, is_active: true }) };
  const logRepo = { insert: async (_c, l) => { state.logs.push(l); return l; } };
  // Cùng ngữ nghĩa với câu SQL thật: [start, end) giao nhau thì trùng; chạm đầu mút thì không.
  const appointmentRepo = {
    findOverlap: async (_c, _tech, start, end) =>
      state.appts.find((a) => Date.parse(a.start) < Date.parse(end) && Date.parse(a.end) > Date.parse(start)) || null,
    insert: async (_c, a) => { const row = { ticket_id: a.ticketId, appointment_type: a.type, start: a.startTime, end: a.endTime }; state.appts.push(row); return row; },
    findByTicket: async () => state.appts,
  };
  const withTransaction = async (fn) => fn({});
  const svc = createTicketService({ ticketRepo, technicianRepo, logRepo, appointmentRepo, db: {}, withTransaction, config: {} });
  return { svc, state };
}
const T = (o = {}) => ({ ticket_id: 1, center_id: 1, technician_id: 5, status: 'DA_PHAN_CONG', ...o });
const who = { changedBy: 'ktv.hai' };
const slot = (s, e, type = 'GIAO') => ({ type, startTime: `2026-10-24T${s}:00Z`, endTime: `2026-10-24T${e}:00Z` });

// ---- cập nhật trạng thái (QT-01) ----
test('trạng thái: DA_PHAN_CONG → DANG_XU_LY thành công và ghi log DOI_TRANG_THAI', async () => {
  const { svc, state } = setup({ ticket: T() });
  const r = await svc.changeStatus(1, { status: 'DANG_XU_LY', ...who });
  assert.equal(r.ticket.status, 'DANG_XU_LY');
  assert.equal(state.logs.length, 1);
  assert.equal(state.logs[0].action, 'DOI_TRANG_THAI');
  assert.equal(state.logs[0].oldStatus, 'DA_PHAN_CONG');
  assert.equal(state.logs[0].changedBy, 'ktv.hai');
});

test('trạng thái: DANG_XU_LY → HOAN_TAT thành công', async () => {
  const { svc } = setup({ ticket: T({ status: 'DANG_XU_LY' }) });
  assert.equal((await svc.changeStatus(1, { status: 'HOAN_TAT', ...who })).ticket.status, 'HOAN_TAT');
});

test('trạng thái: chuyển thẳng DA_PHAN_CONG → HOAN_TAT bị từ chối "Phải chuyển qua Đang xử lý trước" (US05)', async () => {
  const { svc, state } = setup({ ticket: T() });
  await assert.rejects(svc.changeStatus(1, { status: 'HOAN_TAT', ...who }),
    (e) => e.status === 409 && e.code === 'STATUS_SKIP' && /Đang xử lý trước/.test(e.message));
  assert.equal(state.logs.length, 0, 'không ghi log khi bị từ chối');
  assert.equal(state.ticket.status, 'DA_PHAN_CONG');
});

test('trạng thái: đi lùi, lặp lại, phiếu chưa phân công → 409 INVALID_TRANSITION (biên)', async () => {
  const cases = [['HOAN_TAT', 'DANG_XU_LY'], ['DANG_XU_LY', 'DANG_XU_LY'], ['HOAN_TAT', 'HOAN_TAT']];
  for (const [from, to] of cases) {
    const { svc } = setup({ ticket: T({ status: from }) });
    await assert.rejects(svc.changeStatus(1, { status: to, ...who }), (e) => e.status === 409 && e.code === 'INVALID_TRANSITION', `${from}→${to}`);
  }
  const { svc } = setup({ ticket: T({ status: 'MOI', technician_id: null }) });
  await assert.rejects(svc.changeStatus(1, { status: 'DANG_XU_LY', ...who }), (e) => e.status === 409);
});

test('trạng thái: status lạ hoặc thiếu người thực hiện → 400; phiếu không tồn tại → 404', async () => {
  const { svc } = setup({ ticket: T() });
  await assert.rejects(svc.changeStatus(1, { status: 'XYZ', ...who }), (e) => e.status === 400);
  await assert.rejects(svc.changeStatus(1, { status: 'DANG_XU_LY' }), (e) => e.status === 400);
  await assert.rejects(setup().svc.changeStatus(9, { status: 'DANG_XU_LY', ...who }), (e) => e.status === 404);
});

test('trạng thái: kỹ thuật viên không đổi được phiếu của người khác → 403', async () => {
  const { svc } = setup({ ticket: T({ technician_id: 5 }) });
  await assert.rejects(svc.changeStatus(1, { status: 'DANG_XU_LY', ...who, scopeTechnicianId: 6 }), (e) => e.status === 403);
  assert.equal((await svc.changeStatus(1, { status: 'DANG_XU_LY', ...who, scopeTechnicianId: 5 })).ticket.status, 'DANG_XU_LY');
});

// ---- đặt lịch hẹn (QT-05) ----
test('lịch hẹn: khung giờ trống → lưu', async () => {
  const { svc, state } = setup({ ticket: T() });
  const a = await svc.createAppointment(1, slot('09:00', '10:00'));
  assert.equal(a.appointment_type, 'GIAO');
  assert.equal(state.appts.length, 1);
});

test('lịch hẹn: trùng khung giờ → 409 APPOINTMENT_OVERLAP và không lưu thêm (UC04 ngoại lệ)', async () => {
  const { svc, state } = setup({ ticket: T(), appointments: [{ start: '2026-10-24T09:00:00Z', end: '2026-10-24T10:00:00Z' }] });
  await assert.rejects(svc.createAppointment(1, slot('09:30', '10:30')), (e) => e.status === 409 && e.code === 'APPOINTMENT_OVERLAP');
  await assert.rejects(svc.createAppointment(1, slot('08:00', '11:00', 'NHAN')), (e) => e.code === 'APPOINTMENT_OVERLAP', 'khung mới bao trùm khung cũ');
  assert.equal(state.appts.length, 1);
});

test('lịch hẹn: hai khung chỉ chạm đầu mút (10:00–11:00 sau 09:00–10:00) KHÔNG trùng (biên)', async () => {
  const { svc, state } = setup({ ticket: T(), appointments: [{ start: '2026-10-24T09:00:00Z', end: '2026-10-24T10:00:00Z' }] });
  await svc.createAppointment(1, slot('10:00', '11:00', 'NHAN'));
  await svc.createAppointment(1, slot('08:00', '09:00'));
  assert.equal(state.appts.length, 3);
});

test('lịch hẹn: kết thúc trước hoặc bằng bắt đầu, loại lạ, thời điểm rác → 400 (không hợp lệ)', async () => {
  const { svc } = setup({ ticket: T() });
  const bad = [slot('10:00', '09:00'), slot('10:00', '10:00'), { ...slot('09:00', '10:00'), type: 'KHAC' },
    { type: 'GIAO', startTime: 'hôm qua', endTime: '2026-10-24T10:00:00Z' }, undefined, {}];
  for (const b of bad) await assert.rejects(svc.createAppointment(1, b), (e) => e.status === 400, JSON.stringify(b));
});

test('lịch hẹn: phiếu chưa phân công → 409 TICKET_NOT_ASSIGNED; đã hoàn tất → 409 TICKET_CLOSED; không có → 404', async () => {
  await assert.rejects(setup({ ticket: T({ status: 'MOI', technician_id: null }) }).svc.createAppointment(1, slot('09:00', '10:00')),
    (e) => e.status === 409 && e.code === 'TICKET_NOT_ASSIGNED');
  await assert.rejects(setup({ ticket: T({ status: 'HOAN_TAT' }) }).svc.createAppointment(1, slot('09:00', '10:00')),
    (e) => e.status === 409 && e.code === 'TICKET_CLOSED');
  await assert.rejects(setup().svc.createAppointment(1, slot('09:00', '10:00')), (e) => e.status === 404);
});
