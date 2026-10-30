// Dùng chung cho test tích hợp: cần PostgreSQL thật đã `npm run migrate`.
// Bật bằng: TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/smartcrm npm run test:integration
// Không có biến này thì các test tích hợp tự bỏ qua (npm test vẫn xanh).
const crypto = require('node:crypto');
const url = process.env.TEST_DATABASE_URL;
const enabled = Boolean(url);

function load() {
  // Mỗi test có pool RIÊNG (test đóng pool khi xong), không dùng pool singleton của src/backend/src/db.js
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: url });
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
  const ticketRepo = require('../../src/backend/src/repositories/ticketRepository');
  const technicianRepo = require('../../src/backend/src/repositories/technicianRepository');
  const logRepo = require('../../src/backend/src/repositories/ticketLogRepository');
  const appointmentRepo = require('../../src/backend/src/repositories/appointmentRepository');
  const { createTicketService } = require('../../src/backend/src/services/ticketService');
  const service = createTicketService({ ticketRepo, technicianRepo, logRepo, appointmentRepo, db: pool, withTransaction, config: {} });
  return { pool, withTransaction, ticketRepo, technicianRepo, logRepo, service };
}

/** Tạo trung tâm + kỹ thuật viên riêng cho từng test (tên/điện thoại có hậu tố ngẫu nhiên) để không đụng dữ liệu seed. */
async function makeCenter(pool, tag) {
  const { rows } = await pool.query(
    `INSERT INTO service_center(name,address) VALUES ($1,'địa chỉ test') RETURNING center_id`, [`TEST-${tag}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`]);
  return rows[0].center_id;
}
let seq = 0;
async function makeTech(pool, centerId, { skills = {}, active = true } = {}) {
  // Các file test chạy SONG SONG trong các tiến trình riêng, mỗi tiến trình đếm seq từ 0: dùng số ngẫu nhiên mật mã để không trùng.
  const phone = `09${crypto.randomInt(0, 1e9).toString().padStart(9, '0')}`;
  const { rows } = await pool.query(
    `INSERT INTO technician(center_id,full_name,phone,is_active) VALUES ($1,$2,$3,$4) RETURNING technician_id`,
    [centerId, `KTV test ${phone}`, phone, active]);
  const id = rows[0].technician_id;
  for (const [group, level] of Object.entries(skills)) {
    await pool.query('INSERT INTO technician_skill(technician_id,issue_group,proficiency) VALUES ($1,$2,$3)', [id, group, level]);
  }
  return id;
}
const ticketInput = (centerId, over = {}) => ({
  centerId, customerName: 'Khách test', customerPhone: '0912000999', deviceModel: 'Test', issueGroup: 'MAN_HINH',
  priority: 2, dueDate: new Date(Date.now() + 864e5).toISOString(), ...over,
});
/** Xóa dữ liệu test theo thứ tự khóa ngoại. */
async function cleanup(pool, centerId) {
  await pool.query('DELETE FROM appointment WHERE ticket_id IN (SELECT ticket_id FROM ticket WHERE center_id=$1)', [centerId]);
  await pool.query('DELETE FROM ticket_log WHERE ticket_id IN (SELECT ticket_id FROM ticket WHERE center_id=$1)', [centerId]);
  await pool.query('DELETE FROM ticket WHERE center_id=$1', [centerId]);
  await pool.query('DELETE FROM technician_skill WHERE technician_id IN (SELECT technician_id FROM technician WHERE center_id=$1)', [centerId]);
  await pool.query('DELETE FROM technician WHERE center_id=$1', [centerId]);
  await pool.query('DELETE FROM service_center WHERE center_id=$1', [centerId]);
}
module.exports = { enabled, load, makeCenter, makeTech, ticketInput, cleanup };
