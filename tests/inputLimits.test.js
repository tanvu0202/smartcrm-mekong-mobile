// BUG-11: dữ liệu vượt giới hạn cột phải bị từ chối bằng 400 ở tầng service, không để PostgreSQL ném lỗi 500. Unit test.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createTicketService, validateTicketInput } = require('../src/backend/src/services/ticketService');

const base = { centerId: 1, customerName: 'A', customerPhone: '0912345678', deviceModel: 'X', issueGroup: 'PIN', priority: 2, dueDate: '2027-03-02T10:00:00Z' };
const mentions = (k) => (e) => e.status === 400 && e.details.some((m) => m.startsWith(k));

test('BUG-11 (biên 2 phía): tên khách 100 ký tự hợp lệ, 101 ký tự bị từ chối', () => {
  assert.equal(validateTicketInput({ ...base, customerName: 'N'.repeat(100) }).customerName.length, 100);
  assert.throws(() => validateTicketInput({ ...base, customerName: 'N'.repeat(101) }), mentions('customerName'));
});

test('BUG-11: độ dài tính sau khi cắt dấu cách hai đầu (đúng với giá trị sẽ lưu)', () => {
  assert.equal(validateTicketInput({ ...base, customerName: '  ' + 'N'.repeat(100) + '  ' }).customerName.length, 100);
});

test('BUG-11 (biên 2 phía): tên thiết bị 100 / 101 ký tự', () => {
  assert.equal(validateTicketInput({ ...base, deviceModel: 'D'.repeat(100) }).deviceModel.length, 100);
  assert.throws(() => validateTicketInput({ ...base, deviceModel: 'D'.repeat(101) }), mentions('deviceModel'));
});

function assignService() {
  const state = { calls: 0 };
  const service = createTicketService({
    ticketRepo: { findById: async () => { state.calls++; return null; } },
    technicianRepo: {}, logRepo: {}, appointmentRepo: {}, db: {}, withTransaction: async (fn) => fn({}), config: {},
  });
  return { service, state };
}

test('BUG-11 (biên 2 phía): lý do đổi KTV 255 ký tự qua được tầng kiểm tra, 256 ký tự bị 400 trước khi chạm CSDL', async () => {
  const { service, state } = assignService();
  const input = (reason) => ({ technicianId: 2, reason, changedBy: 'dieu.phoi' });
  await assert.rejects(service.reassign(1, input('r'.repeat(256))), { status: 400 });
  assert.equal(state.calls, 0, 'bị chặn trước khi truy vấn CSDL');
  await assert.rejects(service.reassign(1, input('r'.repeat(255))), { status: 404 }, 'qua kiểm tra độ dài, dừng ở bước tìm phiếu (fake trả null)');
});
