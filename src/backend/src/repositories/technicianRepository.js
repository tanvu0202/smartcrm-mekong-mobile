const technicianRepository = {
  async findById(db, id, { forUpdate = false } = {}) {
    const sql = `SELECT technician_id, center_id, full_name, phone, is_active
                 FROM technician WHERE technician_id = $1 ${forUpdate ? 'FOR UPDATE' : ''}`;
    return (await db.query(sql, [id])).rows[0] || null;
  },

  /** KTV cùng trung tâm, đang hoạt động, tay nghề >= minProficiency với nhóm sự cố; kèm số phiếu mở. */
  async findCandidates(db, { centerId, issueGroup, minProficiency }) {
    const { rows } = await db.query(
      `SELECT t.technician_id, t.full_name, t.phone, s.proficiency,
              (SELECT count(*)::int FROM ticket k
                WHERE k.technician_id = t.technician_id AND k.status <> 'HOAN_TAT') AS open_tickets
         FROM technician t
         JOIN technician_skill s ON s.technician_id = t.technician_id AND s.issue_group = $2
        WHERE t.center_id = $1 AND t.is_active AND s.proficiency >= $3
        ORDER BY s.proficiency DESC, open_tickets ASC, t.technician_id`,
      [centerId, issueGroup, minProficiency]);
    return rows;
  },
};
module.exports = technicianRepository;
