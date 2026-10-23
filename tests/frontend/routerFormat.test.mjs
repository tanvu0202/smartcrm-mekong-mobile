// Kiểm thử bộ định tuyến hash và các hàm định dạng hiển thị.
import test from 'node:test';
import assert from 'node:assert/strict';
import { matchRoute, homeFor } from '../../src/frontend/src/lib/router.js';
import { formatDateTime, isOverdue, statusLabel, priorityLabel } from '../../src/frontend/src/lib/format.js';

test('matchRoute: khớp các trang và lấy tham số :id', () => {
  assert.equal(matchRoute('#/queue').name, 'queue');
  assert.deepEqual(matchRoute('#/tickets/12'), { name: 'ticket', params: { id: '12' } });
  assert.equal(matchRoute('#/tickets/12?x=1').params.id, '12');
});
test('matchRoute: dấu / thừa, hash rỗng, đường dẫn lạ → notfound (biên)', () => {
  assert.equal(matchRoute('#/my/').name, 'my');
  assert.equal(matchRoute('').name, 'notfound');
  assert.equal(matchRoute('#/khong-co').name, 'notfound');
  assert.equal(matchRoute('#/tickets/').name, 'notfound');
});
test('homeFor: KTV vào Phiếu của tôi, quản lý vào danh sách', () => {
  assert.equal(homeFor('KTV'), '#/my');
  assert.equal(homeFor('QUAN_LY'), '#/queue');
});
test('formatDateTime: giờ hợp lệ có dạng dd/mm/yyyy hh:mm; null và chuỗi rác → "—", không "Invalid Date"', () => {
  assert.match(formatDateTime('2026-10-23T08:05:00'), /^23\/10\/2026 08:05$/);
  for (const bad of [null, undefined, '', 'khong-phai-ngay']) assert.equal(formatDateTime(bad), '—');
});
test('isOverdue: đúng mốc hạn chưa quá hạn; thiếu hạn không bị coi là quá hạn (biên)', () => {
  const due = '2026-10-23T08:00:00Z';
  const t = Date.parse(due);
  assert.equal(isOverdue(due, t), false);
  assert.equal(isOverdue(due, t + 1), true);
  assert.equal(isOverdue(null, t), false);
});
test('nhãn: mã lạ được trả lại nguyên văn thay vì "undefined"', () => {
  assert.equal(statusLabel('DA_PHAN_CONG'), 'Đã phân công');
  assert.equal(statusLabel('MA_LA'), 'MA_LA');
  assert.equal(priorityLabel(1), 'Cao');
  assert.equal(priorityLabel(9), '9');
});
