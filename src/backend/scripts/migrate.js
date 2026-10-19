// Chạy các file db/migrations/*.sql theo thứ tự tên; ghi nhận vào schema_migrations nên chạy lại an toàn.
const fs = require('node:fs');
const path = require('node:path');
const { pool } = require('../src/db');

(async () => {
  const dir = path.join(__dirname, '..', '..', '..', 'db', 'migrations');
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    filename TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
  const done = new Set((await pool.query('SELECT filename FROM schema_migrations')).rows.map((r) => r.filename));
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.sql')).sort()) {
    if (done.has(f)) { console.log(`bỏ qua  ${f} (đã chạy)`); continue; }
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(fs.readFileSync(path.join(dir, f), 'utf8'));
      await client.query('INSERT INTO schema_migrations(filename) VALUES ($1)', [f]);
      await client.query('COMMIT');
      console.log(`đã chạy ${f}`);
    } catch (e) { await client.query('ROLLBACK'); console.error(`LỖI ${f}: ${e.message}`); process.exitCode = 1; break; }
    finally { client.release(); }
  }
  await pool.end();
})();
