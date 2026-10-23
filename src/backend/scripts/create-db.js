// Tạo database nếu chưa có (thay cho `createdb`/psql – máy Windows thường không có sẵn hai lệnh này trong PATH).
// Kết nối vào database hệ thống `postgres` bằng cùng tài khoản trong .env, rồi CREATE DATABASE <DB_NAME>. Chạy lại an toàn.
const { Client } = require('pg');
const config = require('../src/config');

function targets() {
  if (config.db.connectionString) {
    const u = new URL(config.db.connectionString);
    const name = decodeURIComponent(u.pathname.replace(/^\//, '')) || 'smartcrm';
    u.pathname = '/postgres';
    return { name, admin: { connectionString: u.toString() } };
  }
  const { database, ...rest } = config.db;
  return { name: database, admin: { ...rest, database: 'postgres' } };
}

(async () => {
  const { name, admin } = targets();
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    console.error(`Tên database không hợp lệ: "${name}" (chỉ chữ, số, gạch dưới; không bắt đầu bằng số).`);
    process.exit(1);
  }
  const client = new Client(admin);
  try {
    await client.connect();
    const found = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [name]);
    if (found.rowCount) { console.log(`Database "${name}" đã có – bỏ qua.`); return; }
    await client.query(`CREATE DATABASE "${name}"`);
    console.log(`Đã tạo database "${name}".`);
  } catch (e) {
    console.error(`Không tạo được database: ${e.message}`);
    console.error('Kiểm tra: PostgreSQL đang chạy? DB_USER / DB_PASSWORD trong .env đúng chưa? Tài khoản có quyền CREATEDB không?');
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
})();
