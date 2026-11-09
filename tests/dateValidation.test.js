// BUG-08: ngày không tồn tại phải bị từ chối (400), không được tự dời sang ngày khác. Unit test, không cần CSDL.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createTicketService, validateTicketInput } = require('../src/backend/src/services/ticketService');

const ticket = (dueDate) => ({ centerId: 1, customerName: 'A', customerPhone: '0912345678', deviceModel: 'X', issueGroup: 'PIN', priority: 2, dueDate });
/** true nếu dueDate được chấp nhận; false nếu bị từ chối bằng 400. */
function accepted(dueDate) {
  try { validateTicketInput(ticket(dueDate)); return true; } catch (e) { if (e.status === 400) return false; throw e; }
}

// Service đặt lịch hẹn với repository giả: phiếu đã có KTV, không có lịch nào trùng.
function appointmentService() {
  const saved = [];
  const service = createTicketService({
    ticketRepo: { findById: async () => ({ ticket_id: 1, technician_id: 5, status: 'DA_PHAN_CONG' }) },
    technicianRepo: { findById: async () => ({ technician_id: 5 }) },
    appointmentRepo: { findOverlap: async () => null, insert: async (_c, a) => { saved.push(a); return a; } },
    logRepo: {}, db: {}, withTransaction: async (fn) => fn({}), config: {},
  });
  return { service, saved };
}
const slot = (startTime, endTime) => ({ type: 'GIAO', startTime, endTime });

test('BUG-08: 30/02 và 31/04 bị từ chối, không bị dời sang ngày khác', () => {
  for (const bad of ['2027-02-30T10:00:00Z', '2027-02-31', '2027-04-31T00:00:00Z', '2027-06-31T08:00:00Z']) {
    assert.equal(accepted(bad), false, bad);
  }
});

test('BUG-08: lịch hẹn vào ngày không tồn tại bị 400 và không được lưu', async () => {
  const { service, saved } = appointmentService();
  await assert.rejects(service.createAppointment(1, slot('2033-02-30T02:00:00Z', '2033-02-30T03:00:00Z')), { status: 400 });
  assert.equal(saved.length, 0);
});

test('BUG-08 (biên): 29/02 chỉ hợp lệ ở năm nhuận', () => {
  assert.equal(accepted('2028-02-29T00:00:00Z'), true, '2028 là năm nhuận');
  assert.equal(accepted('2027-02-29T00:00:00Z'), false, '2027 không nhuận');
  assert.equal(accepted('2100-02-29T00:00:00Z'), false, '2100 không nhuận (chia hết 100 nhưng không chia hết 400)');
  assert.equal(accepted('2000-02-29T00:00:00Z'), true, '2000 nhuận');
});

test('BUG-08 (biên): ngày cuối tháng hợp lệ, tháng / giờ / phút ngoài khoảng bị từ chối', () => {
  for (const ok of ['2027-01-31T23:59:59Z', '2027-04-30', '2027-12-31T00:00:00.123Z', '2027-05-01T08:00:00+07:00', '2027-05-01T08:00']) {
    assert.equal(accepted(ok), true, ok);
  }
  for (const bad of ['2027-13-01', '2027-00-10', '2027-01-00', '2027-01-32', '2027-01-01T24:00:00Z', '2027-01-01T10:60:00Z', '2027-01-01T10:00:60Z']) {
    assert.equal(accepted(bad), false, bad);
  }
});

test('BUG-08: giá trị không phải chuỗi ISO (số, chuỗi tự do) bị từ chối', () => {
  for (const bad of [123, 1, 'hôm qua', '01/02/2027', 'Feb 3 2027', '123']) assert.equal(accepted(bad), false, String(bad));
});

test('BUG-08: ngày hợp lệ vẫn được giữ đúng giá trị', async () => {
  assert.equal(validateTicketInput(ticket('2027-03-02T10:00:00Z')).dueDate, '2027-03-02T10:00:00.000Z');
  const { service, saved } = appointmentService();
  await service.createAppointment(1, slot('2030-05-01T02:00:00Z', '2030-05-01T03:00:00Z'));
  assert.deepEqual([saved[0].startTime, saved[0].endTime], ['2030-05-01T02:00:00.000Z', '2030-05-01T03:00:00.000Z']);
});
