// Kiểm thử máy khách HTTP của giao diện: lỗi mạng, 401, lỗi từ backend, ghép URL. fetch được thay bằng hàm giả.
import test from 'node:test';
import assert from 'node:assert/strict';
import { request, buildUrl, session, setUnauthorizedHandler, ApiError } from '../../src/frontend/src/api/client.js';

const json = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const useFetch = (impl) => { globalThis.fetch = impl; };
test.beforeEach(() => { session.clear(); setUnauthorizedHandler(null); });

test('buildUrl: bỏ tham số rỗng/null/undefined, giữ 0 và mã hợp lệ (biên)', () => {
  assert.equal(buildUrl('/tickets', { status: 'MOI', center_id: '', technician_id: undefined, x: null }), '/api/tickets?status=MOI');
  assert.equal(buildUrl('/tickets', { technician_id: 0 }), '/api/tickets?technician_id=0');
  assert.equal(buildUrl('/tickets'), '/api/tickets');
});

test('request: gắn Authorization khi đã đăng nhập, trả về JSON', async () => {
  session.save('tok123', { username: 'dieu.phoi' });
  let seen;
  useFetch(async (url, init) => { seen = { url, init }; return json(200, { data: [] }); });
  const out = await request('/tickets');
  assert.deepEqual(out, { data: [] });
  assert.equal(seen.init.headers.Authorization, 'Bearer tok123');
});

test('request: mất kết nối → ApiError NETWORK có thông báo tiếng Việt', async () => {
  useFetch(async () => { throw new TypeError('fetch failed'); });
  await assert.rejects(request('/tickets'), (e) => e instanceof ApiError && e.code === 'NETWORK' && e.isNetwork && /Không kết nối/.test(e.message));
});

test('request: proxy trả 502 không phải JSON → SERVER_UNAVAILABLE, không văng lỗi cú pháp', async () => {
  useFetch(async () => ({ ok: false, status: 502, json: async () => { throw new SyntaxError('Unexpected token <'); } }));
  await assert.rejects(request('/tickets'), (e) => e.code === 'SERVER_UNAVAILABLE' && e.status === 502);
});

test('request: 401 khi đã đăng nhập → xóa token và báo cho ứng dụng đưa về trang đăng nhập', async () => {
  session.save('het-han', { username: 'a' });
  let notified = null;
  setUnauthorizedHandler((err) => { notified = err; });
  useFetch(async () => json(401, { error: { code: 'TOKEN_EXPIRED', message: 'Phiên đăng nhập đã hết hạn' } }));
  await assert.rejects(request('/tickets'), (e) => e.status === 401 && e.code === 'TOKEN_EXPIRED');
  assert.equal(session.getToken(), null);
  assert.equal(notified.code, 'TOKEN_EXPIRED');
});

test('request: 401 ở trang đăng nhập (auth=false) là "sai mật khẩu", không xóa phiên, không chuyển trang', async () => {
  let notified = false;
  setUnauthorizedHandler(() => { notified = true; });
  useFetch(async () => json(401, { error: { code: 'INVALID_CREDENTIALS', message: 'Sai tên đăng nhập hoặc mật khẩu' } }));
  await assert.rejects(request('/auth/login', { method: 'POST', body: {}, auth: false }), (e) => e.code === 'INVALID_CREDENTIALS');
  assert.equal(notified, false);
});

test('request: lỗi 409 từ backend giữ nguyên mã và thông báo để màn hình hiển thị', async () => {
  useFetch(async () => json(409, { error: { code: 'ALREADY_ASSIGNED', message: 'Phiếu đã được phân công' } }));
  await assert.rejects(request('/tickets/1/assign', { method: 'POST', body: {} }), (e) => e.status === 409 && e.code === 'ALREADY_ASSIGNED' && e.message === 'Phiếu đã được phân công');
});
