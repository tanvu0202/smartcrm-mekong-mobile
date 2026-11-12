// Khi CSDL chết, API phải trả lỗi 503 chung (không lộ chi tiết nội bộ) thay vì treo hay lỗi 500 kèm stack.
const test = require('node:test');
const assert = require('node:assert');
const { errorHandler } = require('../src/backend/src/middleware/errorHandler');

function run(err) {
  const res = { statusCode: null, body: null, status(c) { this.statusCode = c; return this; }, json(b) { this.body = b; return this; } };
  const origErr = console.error; console.error = () => {};
  try { errorHandler(err, {}, res, () => {}); } finally { console.error = origErr; }
  return res;
}

for (const [name, err] of [
  ['ECONNREFUSED', Object.assign(new Error('connect ECONNREFUSED 172.18.0.2:5432'), { code: 'ECONNREFUSED' })],
  ['hết thời gian chờ kết nối', new Error('timeout exceeded when trying to connect')],
  ['mất kết nối giữa chừng', new Error('Connection terminated unexpectedly')],
  ['db đang tắt (57P01)', Object.assign(new Error('terminating connection due to administrator command'), { code: '57P01' })],
]) {
  test(`CSDL không khả dụng (${name}) → 503 DB_UNAVAILABLE, không lộ chi tiết`, () => {
    const res = run(err);
    assert.strictEqual(res.statusCode, 503);
    assert.strictEqual(res.body.error.code, 'DB_UNAVAILABLE');
    assert.doesNotMatch(JSON.stringify(res.body), /ECONNREFUSED|172\.18|5432|stack|at /i);
  });
}

test('lỗi bất ngờ khác vẫn là 500 INTERNAL chung', () => {
  const res = run(new Error('boom'));
  assert.strictEqual(res.statusCode, 500);
  assert.strictEqual(res.body.error.message, 'Lỗi hệ thống');
});
