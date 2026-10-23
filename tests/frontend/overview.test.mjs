// Kiểm thử số liệu tổng quan M1 và phân trang: hàm thuần, không cần trình duyệt.
import test from 'node:test';
import assert from 'node:assert/strict';
import { computeOverview } from '../../src/frontend/src/lib/overview.js';
import { paginate } from '../../src/frontend/src/lib/paginate.js';

const NOW = new Date(2026, 9, 23, 12, 0, 0).getTime(); // 23/10/2026 12:00 giờ máy
const HOUR = 3600 * 1000;
const T = (o) => ({ id: 1, status: 'MOI', technicianId: null, createdAt: new Date(NOW - HOUR).toISOString(), dueDate: new Date(NOW + 48 * HOUR).toISOString(), ...o });
const techs = [{ id: 1, fullName: 'Lê Phúc' }, { id: 2, fullName: 'Nguyễn Hải' }];

test('overview: đếm phiếu phát sinh trong ngày (hợp lệ)', () => {
  const o = computeOverview([T({ id: 1 }), T({ id: 2 }), T({ id: 3, createdAt: new Date(NOW - 30 * HOUR).toISOString() })], techs, NOW);
  assert.equal(o.createdToday, 2);
});

test('overview: mốc nửa đêm: 00:00 hôm nay tính, 23:59 hôm qua không tính (biên)', () => {
  const midnight = new Date(2026, 9, 23, 0, 0, 0).toISOString();
  const lastNight = new Date(2026, 9, 22, 23, 59, 0).toISOString();
  const o = computeOverview([T({ createdAt: midnight }), T({ createdAt: lastNight })], techs, NOW);
  assert.equal(o.createdToday, 1);
});

test('overview: đúng 4 giờ đến hạn tính là "còn ≤ 4 giờ", 4 giờ 1 phút thì không; quá hạn có tính (biên)', () => {
  const at = (ms) => T({ dueDate: new Date(NOW + ms).toISOString() });
  assert.equal(computeOverview([at(4 * HOUR)], techs, NOW).dueSoon, 1);
  assert.equal(computeOverview([at(4 * HOUR + 60000)], techs, NOW).dueSoon, 0);
  assert.equal(computeOverview([at(-5 * HOUR)], techs, NOW).dueSoon, 1);
});

test('overview: phiếu HOAN_TAT không tính quá hạn và không tính là phiếu đang mở', () => {
  const o = computeOverview([T({ status: 'HOAN_TAT', technicianId: 1, dueDate: new Date(NOW - HOUR).toISOString() })], techs, NOW);
  assert.equal(o.dueSoon, 0);
  assert.equal(o.perTechnician[0].open, 0);
});

test('overview: số phiếu mở theo từng kỹ thuật viên; KTV chưa có phiếu hiện 0; phiếu chưa giao không tính', () => {
  const o = computeOverview([
    T({ id: 1, status: 'DA_PHAN_CONG', technicianId: 2 }), T({ id: 2, status: 'DANG_XU_LY', technicianId: 2 }),
    T({ id: 3, status: 'MOI', technicianId: null })], techs, NOW);
  assert.deepEqual(o.perTechnician, [{ id: 1, name: 'Lê Phúc', open: 0 }, { id: 2, name: 'Nguyễn Hải', open: 2 }]);
});

test('overview: danh sách rỗng và ngày giờ hỏng không làm văng lỗi (không hợp lệ)', () => {
  assert.deepEqual(computeOverview([], [], NOW), { createdToday: 0, dueSoon: 0, perTechnician: [] });
  const o = computeOverview([T({ createdAt: 'rác', dueDate: null })], techs, NOW);
  assert.equal(o.createdToday, 0);
  assert.equal(o.dueSoon, 0);
});

test('paginate: 45 dòng, 20 dòng/trang → 3 trang; trang cuối còn 5 dòng', () => {
  const rows = Array.from({ length: 45 }, (_, i) => i);
  const p3 = paginate(rows, 3, 20);
  assert.equal(p3.pages, 3);
  assert.equal(p3.rows.length, 5);
  assert.equal(p3.rows[0], 40);
});

test('paginate: đúng 20 dòng chỉ 1 trang; 21 dòng thành 2 trang (biên)', () => {
  assert.equal(paginate(Array(20).fill(0), 1, 20).pages, 1);
  assert.equal(paginate(Array(21).fill(0), 1, 20).pages, 2);
});

test('paginate: rỗng → 1 trang; trang vượt phạm vi hoặc rác được kẹp về trang hợp lệ (không hợp lệ)', () => {
  assert.deepEqual(paginate([], 1, 20), { rows: [], page: 1, pages: 1, total: 0 });
  assert.equal(paginate([1, 2, 3], 99, 20).page, 1);
  assert.equal(paginate([1, 2, 3], -4, 20).page, 1);
  assert.equal(paginate([1, 2, 3], 'abc', 20).page, 1);
});
