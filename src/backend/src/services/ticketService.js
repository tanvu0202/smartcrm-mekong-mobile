// L3 – Service: quy tắc nghiệp vụ QT-01..QT-06. Không biết gì về HTTP hay SQL.
// Phụ thuộc được tiêm vào (dependency injection) để unit test bằng repository giả.
const { badRequest, notFound, conflict, unprocessable } = require('../errors');

const ISSUE_GROUPS = ['MAN_HINH', 'PIN', 'SAC', 'LOA', 'CAMERA', 'PHAN_MEM', 'KHAC'];

function validateTicketInput(body, { partial = false } = {}) {
  const errors = [];
  const b = body || {};
  const need = (k) => { if (b[k] === undefined || b[k] === null || b[k] === '') errors.push(`${k} là bắt buộc`); };
  const required = partial
    ? ['customerName', 'customerPhone', 'deviceModel', 'issueGroup', 'priority', 'dueDate']
    : ['centerId', 'customerName', 'customerPhone', 'deviceModel', 'issueGroup', 'priority', 'dueDate'];
  required.forEach(need);
  if (b.priority !== undefined && ![1, 2, 3].includes(Number(b.priority))) errors.push('priority phải là 1, 2 hoặc 3');
  if (b.issueGroup && !ISSUE_GROUPS.includes(b.issueGroup)) errors.push(`issueGroup phải thuộc ${ISSUE_GROUPS.join(', ')}`);
  if (b.dueDate && Number.isNaN(Date.parse(b.dueDate))) errors.push('dueDate không phải thời điểm hợp lệ');
  if (b.customerPhone && !/^[0-9+]{8,15}$/.test(b.customerPhone)) errors.push('customerPhone không hợp lệ');
  if (errors.length) throw badRequest('Dữ liệu không hợp lệ', errors);
  return {
    centerId: b.centerId !== undefined ? Number(b.centerId) : undefined,
    customerName: String(b.customerName).trim(),
    customerPhone: b.customerPhone,
    deviceModel: String(b.deviceModel).trim(),
    issueGroup: b.issueGroup,
    issueDescription: b.issueDescription,
    priority: Number(b.priority),
    dueDate: new Date(b.dueDate).toISOString(),
  };
}

function createTicketService({ ticketRepo, technicianRepo, logRepo, db, withTransaction, config }) {
  const warnAt = config?.openTicketWarnThreshold ?? 10;
  const minSkill = config?.minSuggestProficiency ?? 3;

  async function getOrThrow(conn, id, opts) {
    const t = await ticketRepo.findById(conn, id, opts);
    if (!t) throw notFound(`Không tìm thấy phiếu #${id}`);
    return t;
  }


  async function changeAssignment(id, { technicianId, reason, confirm, changedBy } = {}, mode) {
    if (!Number.isInteger(Number(technicianId)) || Number(technicianId) <= 0) throw badRequest('technicianId là bắt buộc');
    if (!changedBy) throw badRequest('changedBy là bắt buộc');
    const techId = Number(technicianId);
    const isChange = mode === 'REASSIGN';

    return withTransaction(async (conn) => {
      const t = await getOrThrow(conn, id, { forUpdate: true }); // khóa dòng: các yêu cầu đồng thời xếp hàng tại đây
      if (t.status === 'HOAN_TAT') throw conflict('Phiếu đã hoàn tất, không thể phân công', 'TICKET_CLOSED'); // QT-01
      if (!isChange && t.status !== 'MOI') {
        throw conflict('Phiếu đã được phân công (có thể do người khác vừa thực hiện); dùng đổi kỹ thuật viên nếu cần', 'TICKET_ALREADY_ASSIGNED'); // QT-02, UC01 5b
      }
      if (isChange && t.technician_id === null) throw conflict('Phiếu chưa có kỹ thuật viên – hãy phân công lần đầu', 'TICKET_NOT_ASSIGNED');
      const tech = await technicianRepo.findById(conn, techId, { forUpdate: true });
      if (!tech || !tech.is_active) throw unprocessable('Kỹ thuật viên không tồn tại hoặc đã ngừng hoạt động', 'TECH_INVALID');
      if (tech.center_id !== t.center_id) throw unprocessable('Kỹ thuật viên khác trung tâm với phiếu', 'TECH_OTHER_CENTER'); // QT-03
      if (t.technician_id === techId) throw conflict('Phiếu đã được gán cho kỹ thuật viên này', 'ALREADY_ASSIGNED'); // QT-02
      if (isChange) {
        if (!reason || !String(reason).trim()) throw badRequest('Đổi kỹ thuật viên bắt buộc nhập lý do'); // QT-04
        if (t.status === 'DANG_XU_LY' && confirm !== true) {
          throw conflict('Phiếu đang xử lý – cần xác nhận (confirm=true) trước khi đổi KTV', 'CONFIRM_REQUIRED'); // QT-04
        }
      }

      const openBefore = await ticketRepo.countOpenByTechnician(conn, techId);
      const newStatus = isChange ? t.status : 'DA_PHAN_CONG';
      const updated = await ticketRepo.setAssignment(conn, id, techId, newStatus);
      const log = await logRepo.insert(conn, {
        ticketId: id,
        action: isChange ? 'DOI_KTV' : 'PHAN_CONG',
        oldTechnicianId: t.technician_id, newTechnicianId: techId,
        oldStatus: t.status, newStatus,
        reason: reason && String(reason).trim() ? String(reason).trim() : null,
        changedBy,
      });
      const warnings = [];
      if (openBefore + 1 >= warnAt) { // QT-06: chỉ cảnh báo, không chặn
        warnings.push({ code: 'TECH_OVERLOADED', message: `KTV ${tech.full_name} đang có ${openBefore + 1} phiếu mở (≥ ${warnAt})` });
      }
      return { ticket: updated, log, warnings };
    });
  }

  return {
    list: (filters) => ticketRepo.findAll(db, filters),

    get: (id) => getOrThrow(db, id),

    async create(body) {
      const t = validateTicketInput(body);
      return withTransaction(async (conn) => {
        const ticketCode = await ticketRepo.nextCode(conn);
        return ticketRepo.insert(conn, { ...t, ticketCode });
      });
    },

    /** Chỉ sửa thông tin khi phiếu còn MOI (chưa ai nhận). */
    async update(id, body) {
      const t = validateTicketInput(body, { partial: true });
      return withTransaction(async (conn) => {
        const cur = await getOrThrow(conn, id, { forUpdate: true });
        if (cur.status !== 'MOI') throw conflict('Chỉ sửa được phiếu ở trạng thái MOI', 'TICKET_NOT_EDITABLE');
        return ticketRepo.updateInfo(conn, id, t);
      });
    },

    async remove(id) {
      return withTransaction(async (conn) => {
        const cur = await getOrThrow(conn, id, { forUpdate: true });
        if (cur.status !== 'MOI') throw conflict('Chỉ xóa được phiếu ở trạng thái MOI', 'TICKET_NOT_DELETABLE');
        await ticketRepo.remove(conn, id);
      });
    },

    /** QT-03: cùng trung tâm, tay nghề >= 3. Kèm cờ cảnh báo QT-06. */
    async suggest(id) {
      const t = await getOrThrow(db, id);
      const rows = await technicianRepo.findCandidates(db, {
        centerId: t.center_id, issueGroup: t.issue_group, minProficiency: minSkill });
      return rows.map((r) => ({ ...r, overloaded: r.open_tickets >= warnAt }));
    },

    /**
     * Phân công LẦN ĐẦU: chỉ khi phiếu đang MOI (MOI → DA_PHAN_CONG).
     * Hai người cùng phân công một phiếu: người đến sau chờ khóa FOR UPDATE rồi nhận 409 TICKET_ALREADY_ASSIGNED
     * (ngoại lệ 5b của UC01). Toàn bộ trong 1 transaction; ticket_log ghi cùng transaction (NFR05).
     */
    assign(id, input = {}) {
      return changeAssignment(id, input, 'ASSIGN');
    },

    /** ĐỔI kỹ thuật viên (QT-04): phiếu đã có KTV, bắt buộc có lý do; phiếu DANG_XU_LY cần confirm=true. */
    reassign(id, input = {}) {
      return changeAssignment(id, input, 'REASSIGN');
    },

    history: async (id) => { await getOrThrow(db, id); return logRepo.findByTicket(db, id); },
  };
}

module.exports = { createTicketService, validateTicketInput, ISSUE_GROUPS };
