// Đếm số dòng các bảng danh mục để chứng minh chạy lại migration / seed KHÔNG nhân đôi dữ liệu (tiêu chí C5).
//   node scripts/dem-dong.js              → in số dòng hiện tại
//   node scripts/dem-dong.js --seed-lai   → chạy LẠI file seed (002) một lần nữa rồi in số dòng
// Dùng cấu hình trong .env như backend; không in mật khẩu.
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { pool } = require('../src/backend/src/db');

(async () => {
  try {
    if (process.argv.includes('--seed-lai')) {
      const f = path.join(__dirname, '..', 'db', 'migrations', '002_seed_catalog.sql');
      await pool.query(fs.readFileSync(f, 'utf8'));
      console.log('(đã chạy lại 002_seed_catalog.sql một lần nữa)');
    }
    const q = async (sql) => (await pool.query(sql)).rows[0].n;
    const rows = {
      service_center: await q('SELECT count(*)::int AS n FROM service_center'),
      technician: await q('SELECT count(*)::int AS n FROM technician'),
      technician_skill: await q('SELECT count(*)::int AS n FROM technician_skill'),
      'ticket (mã BH-0001..0003)': await q("SELECT count(*)::int AS n FROM ticket WHERE ticket_code IN ('BH-0001','BH-0002','BH-0003')"),
      schema_migrations: await q('SELECT count(*)::int AS n FROM schema_migrations'),
    };
    console.table(rows);
  } catch (e) {
    console.error('Không đếm được:', e.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
