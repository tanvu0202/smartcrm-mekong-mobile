// Kiểm thử danh sách nút tài khoản demo ở trang Đăng nhập: phải khớp ba tài khoản thật của backend.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../../src/frontend/src/lib/demoAccounts.js';

const require = createRequire(import.meta.url);
const backend = require('../../src/backend/src/auth/users.js').DEMO_ACCOUNTS;

test('demo: có đúng 3 nút (1 quản lý, 2 kỹ thuật viên) và mật khẩu mặc định demo123 (hợp lệ)', () => {
  assert.equal(DEMO_ACCOUNTS.length, 3);
  assert.equal(DEMO_PASSWORD, 'demo123');
  assert.equal(DEMO_ACCOUNTS.filter((a) => a.roleLabel === 'Quản lý trung tâm').length, 1);
  assert.equal(DEMO_ACCOUNTS.filter((a) => a.roleLabel === 'Kỹ thuật viên').length, 2);
});

test('demo: tên đăng nhập trên giao diện trùng đúng tài khoản backend, cùng tên hiển thị (khớp hai phía)', () => {
  assert.deepEqual(DEMO_ACCOUNTS.map((a) => a.username).sort(), backend.map((a) => a.username).sort());
  for (const a of DEMO_ACCOUNTS) {
    const b = backend.find((x) => x.username === a.username);
    assert.equal(a.fullName, b.fullName, a.username);
    assert.equal(a.roleLabel === 'Quản lý trung tâm', b.role === 'QUAN_LY', a.username);
  }
});

test('demo: mỗi nút đủ tên, vai trò, tên đăng nhập; không trùng tên đăng nhập (không hợp lệ nếu thiếu)', () => {
  const names = new Set();
  for (const a of DEMO_ACCOUNTS) {
    for (const k of ['username', 'fullName', 'roleLabel']) assert.ok(a[k] && a[k].trim(), `${a.username} thiếu ${k}`);
    names.add(a.username);
  }
  assert.equal(names.size, DEMO_ACCOUNTS.length);
});
