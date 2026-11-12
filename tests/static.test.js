// Kiểm thử phục vụ giao diện đã build (đóng gói Docker, Buổi 15–16). Không cần CSDL.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createApp } = require('../src/backend/src/app');

function start(app) {
  return new Promise((resolve) => { const s = app.listen(0, () => resolve(s)); });
}
const stubs = { ticketService: {}, authService: { authenticate() { throw new Error('không dùng'); } } };

test('staticDir: "/" trả trang giao diện, /api/health vẫn trả JSON', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'web-'));
  fs.writeFileSync(path.join(dir, 'index.html'), '<title>Smart CRM</title>');
  const server = await start(createApp({ ...stubs, checkDb: async () => {}, staticDir: dir }));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const page = await fetch(`${base}/`);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /Smart CRM/);
    const health = await fetch(`${base}/api/health`);
    assert.deepEqual(await health.json(), { status: 'ok', db: 'up' });
  } finally { server.close(); fs.rmSync(dir, { recursive: true, force: true }); }
});

test('không có staticDir: "/" là 404 JSON như trước (chế độ dev không đổi)', async () => {
  const server = await start(createApp({ ...stubs, checkDb: async () => {} }));
  try {
    const res = await fetch(`http://127.0.0.1:${server.address().port}/`);
    assert.equal(res.status, 404);
    assert.equal((await res.json()).error.code, 'NOT_FOUND');
  } finally { server.close(); }
});

test('CSDL không trả lời: /api/health trả 503 để healthcheck của Docker báo unhealthy', async () => {
  const server = await start(createApp({ ...stubs, checkDb: async () => { throw new Error('down'); } }));
  try {
    const res = await fetch(`http://127.0.0.1:${server.address().port}/api/health`);
    assert.equal(res.status, 503);
    assert.deepEqual(await res.json(), { status: 'degraded', db: 'down' });
  } finally { server.close(); }
});
