const express = require('express');

/** Lịch hẹn theo mã: đọc, sửa, hủy (xóa mềm). Tạo và liệt kê theo phiếu nằm ở /tickets/:id/appointments. Chỉ quản lý. */
function createAppointmentRoutes(controller, { requireManager }) {
  const r = express.Router();
  r.get('/:id', requireManager, controller.appointment);
  r.put('/:id', requireManager, controller.updateAppointment);
  r.delete('/:id', requireManager, controller.cancelAppointment);
  return r;
}
module.exports = { createAppointmentRoutes };
