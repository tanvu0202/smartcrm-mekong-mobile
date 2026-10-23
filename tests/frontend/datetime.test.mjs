// Kiểm thử đổi ngày + giờ của form lịch hẹn sang thời điểm ISO gửi API.
import test from 'node:test';
import assert from 'node:assert/strict';
import { toIsoRange, tomorrow } from '../../src/frontend/src/lib/datetime.js';
import { toAppointment, toTicket } from '../../src/frontend/src/api/contract.js';

test('toIsoRange: 09:00–10:00 hợp lệ → hai mốc ISO cách nhau đúng 1 giờ', () => {
  const r = toIsoRange('2026-10-24', '09:00', '10:00');
  assert.equal(Date.parse(r.endTime) - Date.parse(r.startTime), 3600 * 1000);
  assert.match(r.startTime, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
});

test('toIsoRange: kết thúc bằng hoặc trước bắt đầu → lỗi tiếng Việt (biên)', () => {
  assert.throws(() => toIsoRange('2026-10-24', '10:00', '10:00'), /Giờ kết thúc phải sau giờ bắt đầu/);
  assert.throws(() => toIsoRange('2026-10-24', '10:00', '09:59'), /Giờ kết thúc phải sau giờ bắt đầu/);
  assert.doesNotThrow(() => toIsoRange('2026-10-24', '10:00', '10:01'));
});

test('toIsoRange: thiếu hoặc sai định dạng ngày / giờ → lỗi (không hợp lệ)', () => {
  assert.throws(() => toIsoRange('', '09:00', '10:00'), /ngày/);
  assert.throws(() => toIsoRange('24/10/2026', '09:00', '10:00'), /ngày/);
  assert.throws(() => toIsoRange('2026-10-24', '', '10:00'), /giờ/);
  assert.throws(() => toIsoRange('2026-10-24', '9h', '10:00'), /giờ/);
  assert.throws(() => toIsoRange('2026-13-45', '09:00', '10:00'));
});

test('tomorrow: cuối tháng và cuối năm chuyển đúng (biên)', () => {
  assert.equal(tomorrow(new Date(2026, 9, 31, 8, 0)), '2026-11-01');
  assert.equal(tomorrow(new Date(2026, 11, 31, 23, 59)), '2027-01-01');
});

test('contract: toAppointment đổi tên trường; thiếu trường → BAD_CONTRACT', () => {
  const a = toAppointment({ appointment_id: 4, appointment_type: 'NHAN', start_time: '2026-10-24T03:00:00Z', end_time: '2026-10-24T04:00:00Z' });
  assert.deepEqual(a, { id: 4, type: 'NHAN', startTime: '2026-10-24T03:00:00Z', endTime: '2026-10-24T04:00:00Z' });
  assert.throws(() => toAppointment({ appointment_id: 4 }), (e) => e.code === 'BAD_CONTRACT');
});

test('contract: toTicket giữ appointment_start cho cột Lịch hẹn, thiếu thì null', () => {
  const base = { ticket_id: 1, ticket_code: 'BH-1', center_id: 1, customer_name: 'A', device_model: 'B', issue_group: 'PIN', priority: 1, status: 'MOI', due_date: '2026-10-24T00:00:00Z' };
  assert.equal(toTicket({ ...base, appointment_start: '2026-10-25T02:00:00Z' }).appointmentStart, '2026-10-25T02:00:00Z');
  assert.equal(toTicket(base).appointmentStart, null);
});
