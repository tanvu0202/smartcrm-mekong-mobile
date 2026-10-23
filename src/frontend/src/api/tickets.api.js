import { get, post } from './client.js';
import { toTicket, toSuggestion, toLog, toAppointment, listOf } from './contract.js';

/** Tham số lọc dùng đúng tên trong hợp đồng API: status, center_id, technician_id. */
export async function listTickets({ status, centerId, technicianId } = {}) {
  const payload = await get('/tickets', { status, center_id: centerId, technician_id: technicianId });
  return listOf(payload, 'danh sách phiếu').map(toTicket);
}

export async function getTicket(id) {
  const payload = await get(`/tickets/${id}`);
  return toTicket(payload.data);
}

export async function getSuggestions(id) {
  const payload = await get(`/tickets/${id}/suggestions`);
  return listOf(payload, 'đề xuất kỹ thuật viên').map(toSuggestion);
}

export async function getHistory(id) {
  const payload = await get(`/tickets/${id}/history`);
  return listOf(payload, 'lịch sử thay đổi').map(toLog);
}

const toResult = (res) => ({
  ticket: toTicket(res.ticket),
  log: toLog(res.log),
  warnings: Array.isArray(res.warnings) ? res.warnings : [],
});

/** Phân công lần đầu (phiếu MOI). Người thực hiện lấy từ token ở server. */
export async function assignTicket(id, { technicianId }) {
  return toResult(await post(`/tickets/${id}/assign`, { technicianId }));
}

/** Đổi kỹ thuật viên: bắt buộc reason; phiếu DANG_XU_LY cần confirm=true. */
export async function reassignTicket(id, { technicianId, reason, confirm }) {
  return toResult(await post(`/tickets/${id}/reassign`, { technicianId, reason, confirm }));
}

/** Kỹ thuật viên chuyển phiếu của mình: DANG_XU_LY rồi HOAN_TAT (không được bỏ bước – QT-01). */
export async function updateStatus(id, status) {
  const res = await post(`/tickets/${id}/status`, { status });
  return { ticket: toTicket(res.ticket), log: toLog(res.log) };
}

export async function getAppointments(id) {
  return listOf(await get(`/tickets/${id}/appointments`), 'lịch hẹn').map(toAppointment);
}

/** Đặt lịch hẹn giao/nhận máy (QT-05: kỹ thuật viên không có hai lịch trùng giờ). */
export async function createAppointment(id, { type, startTime, endTime }) {
  const res = await post(`/tickets/${id}/appointments`, { type, startTime, endTime });
  return toAppointment(res.data);
}
