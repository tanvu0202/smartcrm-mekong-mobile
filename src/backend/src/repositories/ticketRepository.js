// L4 – Repository: chỉ chứa SQL, không chứa quy tắc nghiệp vụ.
// Mỗi hàm nhận `db` (pool hoặc client trong transaction) làm tham số đầu.
const COLS = `ticket_id, ticket_code, center_id, technician_id, customer_name, customer_phone,
  device_model, issue_group, issue_description, priority, status, due_date, created_at`;

const ticketRepository = {
  async findAll(db, { status, centerId, technicianId } = {}) {
    const where = [];
    const params = [];
    if (status) { params.push(status); where.push(`status = $${params.length}`); }
    if (centerId) { params.push(centerId); where.push(`center_id = $${params.length}`); }
    if (technicianId) { params.push(technicianId); where.push(`technician_id = $${params.length}`); }
    const sql = `SELECT ${COLS} FROM ticket ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
                 ORDER BY priority, due_date`; // khớp idx_ticket_queue
    return (await db.query(sql, params)).rows;
  },

  async findById(db, id, { forUpdate = false } = {}) {
    const sql = `SELECT ${COLS} FROM ticket WHERE ticket_id = $1 ${forUpdate ? 'FOR UPDATE' : ''}`;
    return (await db.query(sql, [id])).rows[0] || null;
  },

  async nextCode(db) {
    const { rows } = await db.query(`SELECT 'BH-' || lpad(nextval('ticket_code_seq')::text, 4, '0') AS code`);
    return rows[0].code;
  },

  async insert(db, t) {
    const { rows } = await db.query(
      `INSERT INTO ticket (ticket_code, center_id, customer_name, customer_phone, device_model,
                           issue_group, issue_description, priority, due_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING ${COLS}`,
      [t.ticketCode, t.centerId, t.customerName, t.customerPhone, t.deviceModel,
       t.issueGroup, t.issueDescription ?? null, t.priority, t.dueDate]);
    return rows[0];
  },

  async updateInfo(db, id, t) {
    const { rows } = await db.query(
      `UPDATE ticket SET customer_name=$2, customer_phone=$3, device_model=$4, issue_group=$5,
              issue_description=$6, priority=$7, due_date=$8
       WHERE ticket_id=$1 RETURNING ${COLS}`,
      [id, t.customerName, t.customerPhone, t.deviceModel, t.issueGroup,
       t.issueDescription ?? null, t.priority, t.dueDate]);
    return rows[0] || null;
  },

  async setAssignment(db, id, technicianId, status) {
    const { rows } = await db.query(
      `UPDATE ticket SET technician_id=$2, status=$3 WHERE ticket_id=$1 RETURNING ${COLS}`,
      [id, technicianId, status]);
    return rows[0] || null;
  },

  async remove(db, id) {
    const r = await db.query('DELETE FROM ticket WHERE ticket_id = $1', [id]);
    return r.rowCount > 0;
  },

  /** Số phiếu đang mở (chưa HOAN_TAT) của một KTV – dùng cho QT-06. */
  async countOpenByTechnician(db, technicianId) {
    const { rows } = await db.query(
      `SELECT count(*)::int AS n FROM ticket WHERE technician_id=$1 AND status <> 'HOAN_TAT'`, [technicianId]);
    return rows[0].n;
  },
};
module.exports = ticketRepository;
