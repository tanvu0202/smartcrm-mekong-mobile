const { Pool } = require('pg');
const config = require('./config');

const pool = new Pool(config.db);

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
