/** Nút Trước/Sau cho phân trang 20 dòng (NFR02). Chỉ hiện khi có nhiều hơn một trang. */
export default function Pager({ page, pages, total, onChange }) {
  if (pages <= 1) return null;
  return (
    <div className="pager" role="navigation" aria-label="Phân trang">
      <span>{total} phiếu · trang {page}/{pages}</span>
      <button type="button" className="btn btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>Trước</button>
      <button type="button" className="btn btn-sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>Sau</button>
    </div>
  );
}
