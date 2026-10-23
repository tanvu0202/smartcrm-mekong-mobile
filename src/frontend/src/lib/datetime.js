// Đổi ô ngày + giờ trên form lịch hẹn (giờ máy người dùng) sang cặp thời điểm ISO gửi cho API.
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

/** Ném Error có thông báo tiếng Việt khi thiếu/sai dữ liệu hoặc giờ kết thúc không sau giờ bắt đầu. */
export function toIsoRange(date, start, end) {
  if (!DATE_RE.test(date || '')) throw new Error('Hãy chọn ngày hẹn.');
  if (!TIME_RE.test(start || '') || !TIME_RE.test(end || '')) throw new Error('Hãy nhập giờ bắt đầu và giờ kết thúc.');
  const s = new Date(`${date}T${start}:00`);
  const e = new Date(`${date}T${end}:00`);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) throw new Error('Ngày giờ không hợp lệ.');
  if (e <= s) throw new Error('Giờ kết thúc phải sau giờ bắt đầu.');
  return { startTime: s.toISOString(), endTime: e.toISOString() };
}

/** Ngày mặc định của form: ngày mai theo giờ máy, dạng YYYY-MM-DD. */
export function tomorrow(now = new Date()) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
