const express = require('express');

function createLookupRoutes(controller, { requireManager }) {
  const r = express.Router();
  r.get('/centers', requireManager, controller.centers);
  r.get('/technicians', requireManager, controller.technicians);
  return r;
}
module.exports = { createLookupRoutes };
