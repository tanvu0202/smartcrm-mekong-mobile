// Kiểm thử hợp đồng dữ liệu: backend snake_case → giao diện camelCase; thiếu trường thì báo lỗi rõ.
import test from 'node:test';
import assert from 'node:assert/strict';
import { toTicket, toSuggestion, toLog, listOf } from '../../src/frontend/src/api/contract.js';

const row = { ticket_id: 7, ticket_code: 'BH-0007', center_id: 1, technician_id: null, customer_name: 'Nguyễn Văn Hòa', customer_phone: '0912000001',
  device_model: 'iPhone 13', issue_group: 'MAN_HINH', issue_description: 'Vỡ màn hình', priority: '1', status: 'MOI', due_date: '2026-10-19T13:17:00.000Z' };

test('toTicket: đổi tên trường, ép ưu tiên về số, technician_id null giữ null (hợp lệ)', () => {
  const t = toTicket(row);
  assert.equal(t.code, 'BH-0007');
  assert.equal(t.customerName, 'Nguyễn Văn Hòa');
  assert.equal(t.priority, 1);
  assert.equal(t.technicianId, null);
});

test('toTicket: thiếu trường bắt buộc → BAD_CONTRACT nêu tên trường, không để "undefined" lên màn hình', () => {
  const { due_date, ...thieu } = row;
  assert.throws(() => toTicket(thieu), (e) => e.code === 'BAD_CONTRACT' && e.message.includes('due_date'));
});

test('toTicket: null hoặc không phải object → BAD_CONTRACT (không hợp lệ)', () => {
  for (const bad of [null, undefined, 'x', 5]) assert.throws(() => toTicket(bad), (e) => e.code === 'BAD_CONTRACT');
});

test('toSuggestion: số phiếu đang mở = 0 và tay nghề dạng chuỗi vẫn đọc đúng (biên)', () => {
  const s = toSuggestion({ technician_id: 1, full_name: 'Lê Phúc', proficiency: '5', open_tickets: 0 });
  assert.equal(s.proficiency, 5);
  assert.equal(s.openTickets, 0);
  assert.equal(s.overloaded, false);
});

test('toLog: log_id bigint dạng chuỗi được giữ nguyên chuỗi, lý do thiếu thành chuỗi rỗng', () => {
  const l = toLog({ log_id: '9007199254740993', action: 'PHAN_CONG', changed_by: 'dieu.phoi', changed_at: '2026-10-23T01:00:00Z' });
  assert.equal(l.id, '9007199254740993');
  assert.equal(l.reason, '');
});

test('listOf: lấy mảng trong { data }, thiếu data → BAD_CONTRACT', () => {
  assert.deepEqual(listOf({ data: [1, 2] }, 'phiếu'), [1, 2]);
  assert.deepEqual(listOf({ data: [] }, 'phiếu'), []);
  assert.throws(() => listOf({}, 'phiếu'), (e) => e.code === 'BAD_CONTRACT');
  assert.throws(() => listOf(null, 'phiếu'), (e) => e.code === 'BAD_CONTRACT');
});
