const express = require('express');

/** requireManager: middleware chỉ cho vai trò QUAN_LY. Kỹ thuật viên chỉ được GET danh sách/chi tiết phiếu của mình. */
function createTicketRoutes(controller, { requireManager }) {
  const r = express.Router();
  r.get('/', controller.list);
  r.post('/', requireManager, controller.create);
  r.get('/:id', controller.get);
  r.put('/:id', requireManager, controller.update);
  r.delete('/:id', requireManager, controller.remove);
  r.get('/:id/suggestions', requireManager, controller.suggestions);
  r.post('/:id/assign', requireManager, controller.assign);
  r.post('/:id/reassign', requireManager, controller.reassign);
  r.get('/:id/history', requireManager, controller.history);
  return r;
}
module.exports = { createTicketRoutes };
