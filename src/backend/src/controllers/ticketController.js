// L2 – Controller: đọc request, gọi service, trả JSON. Không chứa quy tắc nghiệp vụ.
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).then(() => {}, next);
const idOf = (req) => {
  const id = Number(req.params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
};

function createTicketController(service) {
  const withId = (fn) => wrap(async (req, res) => {
    const id = idOf(req);
    if (!id) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'id không hợp lệ' } });
    return fn(req, res, id);
  });
  return {
    list: wrap(async (req, res) => {
      const { status, center_id: centerId, technician_id: technicianId } = req.query;
      res.json({ data: await service.list({ status, centerId, technicianId }) });
    }),
    get: withId(async (req, res, id) => res.json({ data: await service.get(id) })),
    create: wrap(async (req, res) => res.status(201).json({ data: await service.create(req.body) })),
    update: withId(async (req, res, id) => res.json({ data: await service.update(id, req.body) })),
    remove: withId(async (req, res, id) => { await service.remove(id); res.status(204).end(); }),
    suggestions: withId(async (req, res, id) => res.json({ data: await service.suggest(id) })),
    reassign: withId(async (req, res, id) => res.json(await service.reassign(id, req.body))),
    assign: withId(async (req, res, id) => res.json(await service.assign(id, req.body))),
    history: withId(async (req, res, id) => res.json({ data: await service.history(id) })),
  };
}
module.exports = { createTicketController };
