// Kiểm thử đăng nhập và phân quyền (Sprint 2): token, authService, middleware. Không cần CSDL.
const test = require('node:test');
const assert = require('node:assert/strict');
const { signToken, verifyToken, TokenError } = require('../src/backend/src/auth/token');
const { DEMO_ACCOUNTS, buildUsers } = require('../src/backend/src/auth/users');
const { createAuthService } = require('../src/backend/src/services/authService');
const { requireAuth, requireRole } = require('../src/backend/src/middleware/auth');

const SECRET = 'bi-mat-thu-nghiem';
const NOW = Date.UTC(2026, 9, 23, 8, 0, 0);

function makeAuth({ tech = { technician_id: 3, full_name: 'Trần Long', is_active: true } } = {}) {
  const users = buildUsers(DEMO_ACCOUNTS, 'demo123');
  const technicianRepo = { findByPhone: async () => tech };
  return createAuthService({ users, secret: SECRET, ttlSeconds: 3600, technicianRepo, db: {}, now: () => NOW });
}

// ---- token ----
test('token: ký rồi kiểm tra lại được đúng dữ liệu (hợp lệ)', () => {
  const t = signToken({ sub: 'dieu.phoi', role: 'QUAN_LY' }, SECRET, { ttlSeconds: 60, nowMs: NOW });
  const p = verifyToken(t, SECRET, NOW + 1000);
  assert.equal(p.sub, 'dieu.phoi');
  assert.equal(p.role, 'QUAN_LY');
});

test('token: đúng thời điểm hết hạn thì bị từ chối (biên)', () => {
  const t = signToken({ sub: 'a' }, SECRET, { ttlSeconds: 60, nowMs: NOW });
  assert.doesNotThrow(() => verifyToken(t, SECRET, NOW + 59_000));
  assert.throws(() => verifyToken(t, SECRET, NOW + 60_000), (e) => e instanceof TokenError && e.code === 'TOKEN_EXPIRED');
});

test('token: sửa nội dung hoặc ký bằng bí mật khác thì bị từ chối (không hợp lệ)', () => {
  const t = signToken({ sub: 'ktv.hai', role: 'KTV' }, SECRET, { ttlSeconds: 60, nowMs: NOW });
  const [h, , s] = t.split('.');
  const forged = Buffer.from(JSON.stringify({ sub: 'ktv.hai', role: 'QUAN_LY', exp: 9999999999 })).toString('base64url');
  assert.throws(() => verifyToken(`${h}.${forged}.${s}`, SECRET, NOW), (e) => e.code === 'TOKEN_INVALID');
  assert.throws(() => verifyToken(t, 'bi-mat-khac', NOW), (e) => e.code === 'TOKEN_INVALID');
});

test('token: rác, rỗng, thiếu phần đều là TOKEN_INVALID (không hợp lệ)', () => {
  for (const bad of ['', 'abc', 'a.b', 'a.b.c.d', '..', null, undefined, 42]) {
    assert.throws(() => verifyToken(bad, SECRET, NOW), (e) => e instanceof TokenError && e.code === 'TOKEN_INVALID', String(bad));
  }
});

test('token: ttl không hợp lệ hoặc thiếu bí mật thì không ký (biên)', () => {
  assert.throws(() => signToken({}, SECRET, { ttlSeconds: 0 }));
  assert.throws(() => signToken({}, SECRET, { ttlSeconds: -5 }));
  assert.throws(() => signToken({}, '', { ttlSeconds: 60 }));
});

// ---- authService.login ----
test('login: quản lý đúng mật khẩu → token + vai trò QUAN_LY, không có technicianId', async () => {
  const r = await makeAuth().login({ username: 'dieu.phoi', password: 'demo123' });
  assert.equal(r.user.role, 'QUAN_LY');
  assert.equal(r.user.technicianId, null);
  assert.equal(r.expiresIn, 3600);
  assert.ok(r.token.split('.').length === 3);
});

test('login: kỹ thuật viên → technicianId lấy từ CSDL, tên lấy từ bản ghi kỹ thuật viên', async () => {
  const r = await makeAuth().login({ username: 'KTV.Long ', password: 'demo123' });
  assert.equal(r.user.role, 'KTV');
  assert.equal(r.user.technicianId, 3);
  assert.equal(r.user.fullName, 'Trần Long');
});

test('login: sai mật khẩu và tên không tồn tại cho cùng một lỗi 401 (không lộ tài khoản)', async () => {
  const auth = makeAuth();
  for (const input of [{ username: 'dieu.phoi', password: 'sai' }, { username: 'khong.co', password: 'demo123' }]) {
    await assert.rejects(auth.login(input), (e) => e.status === 401 && e.code === 'INVALID_CREDENTIALS');
  }
});

test('login: thiếu hoặc sai kiểu dữ liệu → 400, không phải 500', async () => {
  const auth = makeAuth();
  for (const input of [undefined, {}, { username: '', password: 'x' }, { username: 'a', password: '' }, { username: 5, password: 'x' }, { username: '  ', password: 'x' }]) {
    await assert.rejects(auth.login(input), (e) => e.status === 400, JSON.stringify(input));
  }
});

test('login: kỹ thuật viên đã nghỉ việc hoặc không còn trong CSDL → 401 ACCOUNT_DISABLED', async () => {
  for (const tech of [{ technician_id: 3, full_name: 'X', is_active: false }, null]) {
    await assert.rejects(makeAuth({ tech }).login({ username: 'ktv.long', password: 'demo123' }),
      (e) => e.status === 401 && e.code === 'ACCOUNT_DISABLED');
  }
});

// ---- authService.authenticate ----
test('authenticate: Bearer hợp lệ → thông tin người dùng', async () => {
  const auth = makeAuth();
  const { token } = await auth.login({ username: 'ktv.hai', password: 'demo123' });
  const u = auth.authenticate(`Bearer ${token}`);
  assert.equal(u.username, 'ktv.hai');
  assert.equal(u.role, 'KTV');
});

test('authenticate: thiếu header, sai dạng, token lạ → 401 UNAUTHENTICATED', () => {
  const auth = makeAuth();
  for (const h of [undefined, '', 'Bearer', 'Basic abc', 'Bearer a.b.c', 'Bearer x y']) {
    assert.throws(() => auth.authenticate(h), (e) => e.status === 401 && e.code === 'UNAUTHENTICATED', String(h));
  }
});

test('authenticate: token hết hạn → 401 TOKEN_EXPIRED (để giao diện đưa về trang đăng nhập)', async () => {
  const users = buildUsers(DEMO_ACCOUNTS, 'demo123');
  let clock = NOW;
  const auth = createAuthService({ users, secret: SECRET, ttlSeconds: 60, technicianRepo: {}, db: {}, now: () => clock });
  const { token } = await auth.login({ username: 'dieu.phoi', password: 'demo123' });
  clock = NOW + 61_000;
  assert.throws(() => auth.authenticate(`Bearer ${token}`), (e) => e.status === 401 && e.code === 'TOKEN_EXPIRED');
});

// ---- middleware ----
const run = (mw, req) => new Promise((resolve) => mw(req, {}, (err) => resolve(err || null)));

test('requireAuth: có token → gắn req.user; không có → chuyển lỗi 401', async () => {
  const auth = makeAuth();
  const { token } = await auth.login({ username: 'dieu.phoi', password: 'demo123' });
  const req = { headers: { authorization: `Bearer ${token}` } };
  assert.equal(await run(requireAuth(auth), req), null);
  assert.equal(req.user.role, 'QUAN_LY');
  const err = await run(requireAuth(auth), { headers: {} });
  assert.equal(err.status, 401);
});

test('requireRole: đúng vai trò đi tiếp; sai vai trò hoặc chưa đăng nhập → 403', async () => {
  const mw = requireRole('QUAN_LY');
  assert.equal(await run(mw, { user: { role: 'QUAN_LY' } }), null);
  assert.equal((await run(mw, { user: { role: 'KTV' } })).status, 403);
  assert.equal((await run(mw, {})).status, 403);
});
