const express = require('express');

function createTicketRoutes(controller) {
  const r = express.Router();
  r.get('/', controller.list);
  r.post('/', controller.create);
  r.get('/:id', controller.get);
  r.put('/:id', controller.update);
  r.delete('/:id', controller.remove);
  r.get('/:id/suggestions', controller.suggestions);
  r.post('/:id/assign', controller.assign);
  r.post('/:id/reassign', controller.reassign);
  r.get('/:id/history', controller.history);
  return r;
}
module.exports = { createTicketRoutes };
