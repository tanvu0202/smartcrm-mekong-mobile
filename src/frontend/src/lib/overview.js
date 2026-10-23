// Số liệu tổng quan cho M1 (US06): tính ở giao diện từ danh sách phiếu và danh sách kỹ thuật viên – hàm thuần để kiểm thử.
const HOUR = 3600 * 1000;

const sameLocalDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/**
 * - createdToday: phiếu phát sinh trong ngày hôm nay (theo giờ máy)
 * - dueSoon: phiếu chưa hoàn tất đã quá hạn hoặc còn ≤ 4 giờ đến hạn cam kết
 * - perTechnician: số phiếu đang mở (đã giao, chưa HOAN_TAT) của từng kỹ thuật viên
 */
export function computeOverview(tickets, technicians, nowMs = Date.now()) {
  const now = new Date(nowMs);
  let createdToday = 0;
  let dueSoon = 0;
  const open = new Map();
  for (const t of tickets) {
    const created = t.createdAt ? new Date(t.createdAt) : null;
    if (created && !Number.isNaN(created.getTime()) && sameLocalDay(created, now)) createdToday += 1;
    if (t.status === 'HOAN_TAT') continue;
    const due = t.dueDate ? new Date(t.dueDate).getTime() : NaN;
    if (Number.isFinite(due) && due <= nowMs + 4 * HOUR) dueSoon += 1;
    if (t.technicianId != null) open.set(t.technicianId, (open.get(t.technicianId) ?? 0) + 1);
  }
  const perTechnician = technicians.map((k) => ({ id: k.id, name: k.fullName, open: open.get(k.id) ?? 0 }));
  return { createdToday, dueSoon, perTechnician };
}
