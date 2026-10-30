// L4 – Repository lịch hẹn: chỉ SQL.
const COLS = 'appointment_id, ticket_id, appointment_type, start_time, end_time, status, created_at';

const appointmentRepository = {
  /**
   * QT-05: lịch hẹn ĐANG HIỆU LỰC của cùng kỹ thuật viên (qua phiếu) giao với khoảng [start, end).
   * Hai khung chỉ chạm đầu mút (kết thúc 10:00, bắt đầu 10:00) KHÔNG coi là trùng.
   */
  async findOverlap(db, technicianId, startTime, endTime, excludeId = null) {
    const { rows } = await db.query(
      `SELECT a.appointment_id, a.ticket_id, a.start_time, a.end_time
         FROM appointment a JOIN ticket t ON t.ticket_id = a.ticket_id
        WHERE t.technician_id = $1 AND a.status = 'DA_DAT'
          AND a.start_time < $3 AND a.end_time > $2
          AND ($4::int IS NULL OR a.appointment_id <> $4)
        ORDER BY a.start_time LIMIT 1`,
      [technicianId, startTime, endTime, excludeId]);
    return rows[0] || null;
  },

  async insert(db, a) {
    const { rows } = await db.query(
      `INSERT INTO appointment (ticket_id, appointment_type, start_time, end_time)
       VALUES ($1,$2,$3,$4) RETURNING ${COLS}`,
      [a.ticketId, a.type, a.startTime, a.endTime]);
    return rows[0];
  },

  async findById(db, id, { forUpdate = false } = {}) {
    const { rows } = await db.query(
      `SELECT ${COLS} FROM appointment WHERE appointment_id = $1${forUpdate ? ' FOR UPDATE' : ''}`, [id]);
    return rows[0] || null;
  },

  async update(db, id, a) {
    const { rows } = await db.query(
      `UPDATE appointment SET appointment_type = $2, start_time = $3, end_time = $4
        WHERE appointment_id = $1 RETURNING ${COLS}`,
      [id, a.type, a.startTime, a.endTime]);
    return rows[0];
  },

  /** Hủy lịch = xóa mềm: giữ dòng, đặt status 'DA_HUY' (lịch hủy không còn được tính khi kiểm tra trùng giờ). */
  async cancel(db, id) {
    const { rows } = await db.query(
      `UPDATE appointment SET status = 'DA_HUY' WHERE appointment_id = $1 RETURNING ${COLS}`, [id]);
    return rows[0];
  },

  async findByTicket(db, ticketId) {
    const { rows } = await db.query(
      `SELECT ${COLS} FROM appointment WHERE ticket_id = $1 AND status = 'DA_DAT' ORDER BY start_time`, [ticketId]);
    return rows;
  },
};
module.exports = appointmentRepository;
