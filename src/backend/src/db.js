const { Pool } = require('pg');
const config = require('./config');

const pool = new Pool(config.db);

// Kết nối rỗi bị ngắt (ví dụ CSDL dừng đột ngột) phát sự kiện 'error'; không bắt thì tiến trình Node sập.
pool.on('error', (err) => console.error('Kết nối CSDL bị ngắt:', err.code || err.message));

/** Chạy fn(client) trong một transaction; lỗi thì ROLLBACK (NFR05). */
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, withTransaction };
