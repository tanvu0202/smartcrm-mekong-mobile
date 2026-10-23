// L2 – Controller: đọc request, gọi service, trả JSON. Không chứa quy tắc nghiệp vụ.
const { forbidden } = require('../errors');

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).then(() => {}, next);
const idOf = (req) => {
  const id = Number(req.params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
};
const isTechnician = (req) => req.user?.role === 'KTV';

function createTicketController(service) {
  const withId = (fn) => wrap(async (req, res) => {
    const id = idOf(req);
    if (!id) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'id không hợp lệ' } });
    return fn(req, res, id);
  });
  return {
    list: wrap(async (req, res) => {
      const { status, center_id: centerId, technician_id: technicianId } = req.query;
      // Kỹ thuật viên chỉ thấy phiếu của chính mình: server tự ép bộ lọc, không tin tham số từ giao diện.
      const scoped = isTechnician(req) ? req.user.technicianId : technicianId;
      res.json({ data: await service.list({ status, centerId, technicianId: scoped }) });
    }),
    get: withId(async (req, res, id) => {
      const ticket = await service.get(id);
      if (isTechnician(req) && ticket.technician_id !== req.user.technicianId) {
        throw forbidden('Phiếu này không được giao cho bạn');
      }
      res.json({ data: ticket });
    }),
    create: wrap(async (req, res) => res.status(201).json({ data: await service.create(req.body) })),
    update: withId(async (req, res, id) => res.json({ data: await service.update(id, req.body) })),
    remove: withId(async (req, res, id) => { await service.remove(id); res.status(204).end(); }),
    suggestions: withId(async (req, res, id) => res.json({ data: await service.suggest(id) })),
    // Người thực hiện lấy từ token đăng nhập, không lấy từ body (NFR05: lịch sử phải ghi đúng người).
    reassign: withId(async (req, res, id) => res.json(await service.reassign(id, { ...req.body, changedBy: req.user.username }))),
    assign: withId(async (req, res, id) => res.json(await service.assign(id, { ...req.body, changedBy: req.user.username }))),
    // Kỹ thuật viên chỉ cập nhật phiếu của mình (server ép scope); quản lý cập nhật được mọi phiếu.
    changeStatus: withId(async (req, res, id) => res.json(await service.changeStatus(id, {
      status: req.body?.status, changedBy: req.user.username,
      scopeTechnicianId: isTechnician(req) ? req.user.technicianId : undefined,
    }))),
    createAppointment: withId(async (req, res, id) => res.status(201).json({ data: await service.createAppointment(id, req.body) })),
    appointments: withId(async (req, res, id) => res.json({ data: await service.listAppointments(id) })),
    history: withId(async (req, res, id) => res.json({ data: await service.history(id) })),
  };
}
module.exports = { createTicketController };
