// BUG-09: tên / thiết bị / SĐT chỉ gồm dấu cách phải bị từ chối. Unit test, không cần CSDL.
const test = require('node:test');
const assert = require('node:assert/strict');
const { validateTicketInput } = require('../src/backend/src/services/ticketService');

const base = { centerId: 1, customerName: 'Nguyễn Văn A', customerPhone: '0912345678', deviceModel: 'iPhone 13', issueGroup: 'PIN', priority: 2, dueDate: '2027-03-02T10:00:00Z' };

test('BUG-09: tên chỉ gồm dấu cách -> 400 nêu rõ customerName', () => {
  for (const blank of ['     ', ' ', '\t', '\n  \t']) {
    assert.throws(() => validateTicketInput({ ...base, customerName: blank }),
      (e) => e.status === 400 && e.details.some((m) => m.startsWith('customerName')));
  }
});

test('BUG-09: các trường chữ khác cũng không được chỉ có dấu cách', () => {
  for (const k of ['deviceModel', 'customerPhone', 'dueDate']) {
    assert.throws(() => validateTicketInput({ ...base, [k]: '   ' }), (e) => e.status === 400 && e.details.some((m) => m.startsWith(k)), k);
  }
});

test('BUG-09 (biên): tên 1 ký tự hợp lệ; tên có dấu cách hai đầu được cắt gọn', () => {
  assert.equal(validateTicketInput({ ...base, customerName: 'A' }).customerName, 'A');
  assert.equal(validateTicketInput({ ...base, customerName: '   Trần B   ' }).customerName, 'Trần B');
});

test('BUG-09: cập nhật một phần (partial) cũng áp dụng', () => {
  const { centerId, ...noCenter } = base;
  assert.throws(() => validateTicketInput({ ...noCenter, customerName: '  ' }, { partial: true }), { status: 400 });
});
