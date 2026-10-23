export const STATUS_LABEL = {
  MOI: 'Mới (chờ phân công)',
  DA_PHAN_CONG: 'Đã phân công',
  DANG_XU_LY: 'Đang xử lý',
  HOAN_TAT: 'Hoàn tất',
};
export const PRIORITY_LABEL = { 1: 'Cao', 2: 'Trung bình', 3: 'Thấp' };
export const ISSUE_LABEL = {
  MAN_HINH: 'Màn hình', PIN: 'Pin', SAC: 'Sạc', LOA: 'Loa', CAMERA: 'Camera', PHAN_MEM: 'Phần mềm', KHAC: 'Khác',
};
export const ACTION_LABEL = { PHAN_CONG: 'Phân công', DOI_KTV: 'Đổi kỹ thuật viên', DOI_TRANG_THAI: 'Đổi trạng thái' };

export const APPOINTMENT_LABEL = { GIAO: 'Giao', NHAN: 'Nhận' };
export const appointmentLabel = (t) => APPOINTMENT_LABEL[t] ?? t;
export const statusLabel = (s) => STATUS_LABEL[s] ?? s;
export const priorityLabel = (p) => PRIORITY_LABEL[p] ?? String(p);
export const issueLabel = (g) => ISSUE_LABEL[g] ?? g;
export const actionLabel = (a) => ACTION_LABEL[a] ?? a;

/** ISO → '21/10/2026 18:55'. Dữ liệu sai (null, chuỗi rác) → '—', không bao giờ hiện "Invalid Date". */
export function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** ISO → '09/10 15:00' (dạng ngắn của wireframe). Dữ liệu sai → '—'. */
export function formatShort(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Quá hạn cam kết? (hạn thiếu/sai → false) */
export function isOverdue(iso, now = Date.now()) {
  const t = iso ? new Date(iso).getTime() : NaN;
  return Number.isFinite(t) && t < now;
}
