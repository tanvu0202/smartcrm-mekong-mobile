// Danh mục chỉ đọc cho giao diện: trung tâm và kỹ thuật viên.
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).then(() => {}, next);

function createLookupController(service) {
  return {
    centers: wrap(async (req, res) => res.json({ data: await service.listCenters() })),
    technicians: wrap(async (req, res) => res.json({ data: await service.listTechnicians({ centerId: req.query.center_id }) })),
  };
}
module.exports = { createLookupController };
