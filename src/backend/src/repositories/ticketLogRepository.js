const ticketLogRepository = {
  async insert(db, l) {
    const { rows } = await db.query(
      `INSERT INTO ticket_log (ticket_id, action, old_technician_id, new_technician_id,
                               old_status, new_status, reason, changed_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING log_id, ticket_id, action, old_technician_id, new_technician_id,
                 old_status, new_status, reason, changed_by, changed_at`,
      [l.ticketId, l.action, l.oldTechnicianId ?? null, l.newTechnicianId ?? null,
       l.oldStatus ?? null, l.newStatus ?? null, l.reason ?? null, l.changedBy]);
    return rows[0];
  },

  async findByTicket(db, ticketId) {
    const { rows } = await db.query(
      `SELECT log_id, ticket_id, action, old_technician_id, new_technician_id,
              old_status, new_status, reason, changed_by, changed_at
         FROM ticket_log WHERE ticket_id = $1 ORDER BY changed_at, log_id`, [ticketId]);
    return rows;
  },
};
module.exports = ticketLogRepository;
