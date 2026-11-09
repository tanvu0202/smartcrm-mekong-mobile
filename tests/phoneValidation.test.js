// BUG-10: số điện thoại: dấu + chỉ được đứng đầu, 8–15 chữ số. Unit test, không cần CSDL.
const test = require('node:test');
const assert = require('node:assert/strict');
const { validateTicketInput } = require('../src/backend/src/services/ticketService');

const withPhone = (customerPhone) => ({ centerId: 1, customerName: 'A', customerPhone, deviceModel: 'X', issueGroup: 'PIN', priority: 2, dueDate: '2027-03-02T10:00:00Z' });
const rejected = (p) => assert.throws(() => validateTicketInput(withPhone(p)), (e) => e.status === 400 && e.details.some((m) => m.startsWith('customerPhone')), p);

test('BUG-10: toàn dấu + hoặc dấu + nằm giữa số bị từ chối', () => {
  ['++++++++', '+++++++++++', '0912+345+678', '09123456+8', '+84+912345678', '++84912345678', '0912345678+'].forEach(rejected);
});

test('BUG-10 (biên): 8 chữ số hợp lệ, 7 thì không; 15 chữ số hợp lệ, 16 thì không', () => {
  assert.equal(validateTicketInput(withPhone('12345678')).customerPhone, '12345678');
  rejected('1234567');
  assert.equal(validateTicketInput(withPhone('123456789012345')).customerPhone, '123456789012345');
  rejected('1234567890123456');
});

test('BUG-10: số trong nước và số dạng quốc tế vẫn hợp lệ', () => {
  for (const ok of ['0912345678', '02838000001', '+84912345678', '+12025550123']) {
    assert.equal(validateTicketInput(withPhone(ok)).customerPhone, ok);
  }
});

test('BUG-10: chữ cái, khoảng trắng, dấu gạch bị từ chối', () => {
  ['09123abc78', '0912 345 678', '0912-345-678', '(091)2345678', 'abcdefgh'].forEach(rejected);
});
