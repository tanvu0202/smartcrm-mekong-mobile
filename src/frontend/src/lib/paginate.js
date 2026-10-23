/** Phân trang phía giao diện (NFR02: 20 dòng/trang). page tính từ 1; vượt phạm vi thì kẹp về trang hợp lệ. */
export function paginate(rows, page = 1, size = 20) {
  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / size));
  const current = Math.min(Math.max(1, Number(page) || 1), pages);
  return { rows: rows.slice((current - 1) * size, current * size), page: current, pages, total };
}
