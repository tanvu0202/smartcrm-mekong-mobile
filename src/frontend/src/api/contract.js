// HỢP ĐỒNG DỮ LIỆU giữa backend (snake_case, theo docs/api-contract.md) và giao diện (camelCase).
// Lỗi "undefined" trên màn hình gần như luôn do hai bên đọc khác tên trường; vì vậy mọi chuyển đổi nằm MỘT chỗ
// và thiếu trường bắt buộc thì báo lỗi rõ ràng thay vì để màn hình hiện "undefined".
import { ApiError } from './client.js';

function need(row, keys, what) {
  if (row === null || typeof row !== 'object') {
    throw new ApiError({ code: 'BAD_CONTRACT', message: `Dữ liệu ${what} không hợp lệ.` });
  }
  const missing = keys.filter((k) => !(k in row));
  if (missing.length) {
    throw new ApiError({ code: 'BAD_CONTRACT', message: `Dữ liệu ${what} thiếu trường: ${missing.join(', ')}.` });
  }
}

export function toTicket(row) {
  need(row, ['ticket_id', 'ticket_code', 'center_id', 'customer_name', 'device_model', 'issue_group', 'priority', 'status', 'due_date'], 'phiếu');
  return {
    id: row.ticket_id,
    code: row.ticket_code,
    centerId: row.center_id,
    technicianId: row.technician_id ?? null,
    customerName: row.customer_name,
    customerPhone: row.customer_phone ?? '',
    deviceModel: row.device_model,
    issueGroup: row.issue_group,
    issueDescription: row.issue_description ?? '',
    priority: Number(row.priority),
    status: row.status,
    dueDate: row.due_date,
    createdAt: row.created_at ?? null,
  };
}

export function toSuggestion(row) {
  need(row, ['technician_id', 'full_name', 'proficiency', 'open_tickets'], 'đề xuất kỹ thuật viên');
  return {
    technicianId: row.technician_id,
    fullName: row.full_name,
    phone: row.phone ?? '',
    proficiency: Number(row.proficiency),
    openTickets: Number(row.open_tickets),
    overloaded: Boolean(row.overloaded),
  };
}

export function toTechnician(row) {
  need(row, ['technician_id', 'center_id', 'full_name'], 'kỹ thuật viên');
  return { id: row.technician_id, centerId: row.center_id, fullName: row.full_name, phone: row.phone ?? '' };
}

export function toCenter(row) {
  need(row, ['center_id', 'name'], 'trung tâm');
  return { id: row.center_id, name: row.name };
}

export function toLog(row) {
  need(row, ['log_id', 'action', 'changed_by', 'changed_at'], 'lịch sử thay đổi');
  return {
    id: String(row.log_id), // log_id là bigint nên backend trả chuỗi
    action: row.action,
    oldTechnicianId: row.old_technician_id ?? null,
    newTechnicianId: row.new_technician_id ?? null,
    oldStatus: row.old_status ?? null,
    newStatus: row.new_status ?? null,
    reason: row.reason ?? '',
    changedBy: row.changed_by,
    changedAt: row.changed_at,
  };
}

/** Lấy mảng trong { data: [...] }; thiếu thì báo lỗi hợp đồng. */
export function listOf(payload, what) {
  if (!payload || !Array.isArray(payload.data)) {
    throw new ApiError({ code: 'BAD_CONTRACT', message: `Dữ liệu ${what} không phải danh sách.` });
  }
  return payload.data;
}
