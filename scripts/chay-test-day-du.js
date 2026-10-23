// Chạy toàn bộ test KỂ CẢ 4 test tích hợp: lấy thông tin CSDL từ .env, tự lắp TEST_DATABASE_URL rồi chạy `node --test`.
// Dùng:  npm run test:full      (không cần gõ biến môi trường, mật khẩu không hiện ra màn hình)
require('dotenv').config();
const { spawnSync } = require('node:child_process');
const e = process.env;
const enc = encodeURIComponent;
const url = e.DATABASE_URL
  || `postgresql://${enc(e.DB_USER || '')}:${enc(e.DB_PASSWORD || '')}@${e.DB_HOST || 'localhost'}:${e.DB_PORT || 5432}/${e.DB_NAME || 'smartcrm'}`;
if (!e.DATABASE_URL && !e.DB_PASSWORD) {
  console.error('Thiếu DB_PASSWORD (hoặc DATABASE_URL) trong .env – xem .env.example.');
  process.exit(1);
}
const r = spawnSync(process.execPath, ['--test'], { stdio: 'inherit', env: { ...e, TEST_DATABASE_URL: url } });
process.exit(r.status === null ? 1 : r.status);
