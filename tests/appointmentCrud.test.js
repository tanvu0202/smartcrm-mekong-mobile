// Kiểm thử CRUD lịch hẹn (đọc, sửa, hủy) ở lớp nghiệp vụ, dùng repository giả có cùng ngữ nghĩa với câu SQL thật:
// hai khung [start, end) giao nhau thì trùng, chạm đầu mút thì không; lịch đã hủy không được tính; sửa thì bỏ qua chính nó.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createTicketService } = require('../src/backend/src/services/ticketService');

const at = (h, m = 0) => new Date(Date.UTC(2026, 10, 2, h, m)).toISOString(); // 02/11/2026
function setup({ tickets, appts }) {
  const state = {
    tickets: new Map(tickets.map((t) => [t.ticket_id, { ...t }])),
    appts: appts.map((a) => ({ appointment_type: 'GIAO', status: 'DA_DAT', ...a })),
  };
  const ticketRepo = { findById: async (_c, id) => (state.tickets.get(id) ? { ...state.tickets.get(id) } : null) };
  const technicianRepo = { findById: async (_c, id) => ({ technician_id: id }) };
  const appointmentRepo = {
    findById: async (_c, id) => state.appts.find((a) => a.appointment_id === id) || null,
    findOverlap: async (_c, tech, start, end, excludeId = null) => state.appts.find((a) =>
      state.tickets.get(a.ticket_id).technician_id === tech && a.status === 'DA_DAT' && a.appointment_id !== excludeId
      && Date.parse(a.start_time) < Date.parse(end) && Date.parse(a.end_time) > Date.parse(start)) || null,
    insert: async (_c, a) => {
      const row = { appointment_id: 100 + state.appts.length, ticket_id: a.ticketId, appointment_type: a.type, start_time: a.startTime, end_time: a.endTime, status: 'DA_DAT' };
      state.appts.push(row); return row;
    },
    update: async (_c, id, a) => Object.assign(state.appts.find((x) => x.appointment_id === id), { appointment_type: a.type, start_time: a.startTime, end_time: a.endTime }),
    cancel: async (_c, id) => Object.assign(state.appts.find((x) => x.appointment_id === id), { status: 'DA_HUY' }),
    findByTicket: async (_c, id) => state.appts.filter((a) => a.ticket_id === id && a.status === 'DA_DAT'),
  };
  const svc = createTicketService({ ticketRepo, technicianRepo, logRepo: {}, appointmentRepo, db: {}, withTransaction: async (fn) => fn({}), config: {} });
  return { svc, state };
}
// Hai phiếu của CÙNG kỹ thuật viên 5: lịch 1 (phiếu 1) 09:00–10:00, lịch 2 (phiếu 2) 11:00–12:00
const base = () => setup({
  tickets: [{ ticket_id: 1, technician_id: 5, status: 'DA_PHAN_CONG' }, { ticket_id: 2, technician_id: 5, status: 'DANG_XU_LY' }],
  appts: [
    { appointment_id: 1, ticket_id: 1, start_time: at(9), end_time: at(10) },
    { appointment_id: 2, ticket_id: 2, start_time: at(11), end_time: at(12) },
  ],
});
const body = (s, e, type = 'GIAO') => ({ type, startTime: s, endTime: e });

test('lịch hẹn – đọc: có thì trả đúng lịch, không có thì 404', async () => {
  const { svc } = base();
  assert.equal((await svc.getAppointment(1)).ticket_id, 1);
  await assert.rejects(svc.getAppointment(99), (e) => e.status === 404);
});

test('lịch hẹn – sửa: dời sang khung giờ trống thì lưu (hợp lệ)', async () => {
  const { svc, state } = base();
  const r = await svc.updateAppointment(1, body(at(14), at(15), 'NHAN'));
  assert.equal(r.appointment_type, 'NHAN');
  assert.equal(state.appts[0].start_time, at(14));
});

test('lịch hẹn – sửa: dời chồng lên lịch KHÁC của cùng kỹ thuật viên → 409 APPOINTMENT_OVERLAP, không đổi gì', async () => {
  const { svc, state } = base();
  await assert.rejects(svc.updateAppointment(1, body(at(10, 30), at(11, 30))), (e) => e.status === 409 && e.code === 'APPOINTMENT_OVERLAP');
  assert.equal(state.appts[0].start_time, at(9), 'lịch cũ giữ nguyên');
});

test('lịch hẹn – sửa: dời chồng một phần lên CHÍNH NÓ thì hợp lệ (biên: bỏ qua chính lịch đang sửa)', async () => {
  const { svc } = base();
  const r = await svc.updateAppointment(1, body(at(9, 30), at(10, 30)));
  assert.equal(r.start_time, at(9, 30));
});

test('lịch hẹn – sửa: chạm đầu mút với lịch khác (kết thúc 11:00 = bắt đầu 11:00) thì hợp lệ (biên)', async () => {
  const { svc } = base();
  assert.equal((await svc.updateAppointment(1, body(at(10), at(11)))).end_time, at(11));
});

test('lịch hẹn – sửa: dữ liệu sai → 400 (loại lạ, kết thúc không sau bắt đầu, thời điểm rác, thiếu trường)', async () => {
  const { svc } = base();
  for (const b of [body(at(9), at(10), 'XYZ'), body(at(10), at(10)), body(at(10), at(9)), body('rac', at(10)), {}, undefined]) {
    await assert.rejects(svc.updateAppointment(1, b), (e) => e.status === 400, JSON.stringify(b));
  }
  await assert.rejects(svc.updateAppointment(99, body(at(9), at(10))), (e) => e.status === 404);
});

test('lịch hẹn – sửa: lịch đã hủy → 409 APPOINTMENT_CANCELLED; phiếu đã hoàn tất → 409 TICKET_CLOSED', async () => {
  const a = base();
  await a.svc.cancelAppointment(1);
  await assert.rejects(a.svc.updateAppointment(1, body(at(14), at(15))), (e) => e.status === 409 && e.code === 'APPOINTMENT_CANCELLED');
  const b = base();
  b.state.tickets.get(1).status = 'HOAN_TAT';
  await assert.rejects(b.svc.updateAppointment(1, body(at(14), at(15))), (e) => e.status === 409 && e.code === 'TICKET_CLOSED');
});

test('lịch hẹn – hủy: đặt trạng thái DA_HUY, biến mất khỏi danh sách của phiếu; hủy lần hai → 409; không tồn tại → 404', async () => {
  const { svc } = base();
  await svc.cancelAppointment(1);
  assert.equal((await svc.getAppointment(1)).status, 'DA_HUY', 'xóa mềm: dòng vẫn còn, đọc theo mã vẫn thấy');
  assert.equal((await svc.listAppointments(1)).length, 0);
  await assert.rejects(svc.cancelAppointment(1), (e) => e.status === 409 && e.code === 'APPOINTMENT_CANCELLED');
  await assert.rejects(svc.cancelAppointment(99), (e) => e.status === 404);
});

test('lịch hẹn – hủy giải phóng khung giờ: đặt lại đúng khung vừa hủy cho phiếu khác của cùng kỹ thuật viên thì được', async () => {
  const { svc } = base();
  await assert.rejects(svc.createAppointment(2, body(at(9), at(10))), (e) => e.code === 'APPOINTMENT_OVERLAP', 'trước khi hủy thì trùng');
  await svc.cancelAppointment(1);
  const r = await svc.createAppointment(2, body(at(9), at(10)));
  assert.equal(r.ticket_id, 2);
});
