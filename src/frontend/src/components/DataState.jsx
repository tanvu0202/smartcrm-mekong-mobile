import { resolveViewState } from '../lib/viewState.js';

/**
 * Bọc mọi vùng dữ liệu lấy từ API; hiển thị đúng một trong ba trạng thái hoặc nội dung:
 *  - đang tải → thông báo + biểu tượng quay
 *  - lỗi      → thông báo lỗi + nút "Thử lại" (gọi onRetry)
 *  - rỗng     → thông báo rỗng (hoặc emptyContent nếu cần hành động tiếp theo)
 *  - có dữ liệu → children (có thể là hàm nhận data)
 * `state` là kết quả của useApi().
 */
export default function DataState({ state, loadingMessage = 'Đang tải…', emptyMessage = 'Không có dữ liệu', emptyContent, isEmpty, onRetry, children }) {
  const view = resolveViewState({ loading: state.loading, error: state.error, data: state.data, isEmpty });
  if (view === 'loading') {
    return (
      <div className="state state-loading" role="status" aria-busy="true">
        <span className="spinner" aria-hidden="true" /> {loadingMessage}
      </div>
    );
  }
  if (view === 'error') {
    return (
      <div className="state state-error" role="alert">
        <p>{state.error?.message ?? 'Có lỗi xảy ra.'}</p>
        {onRetry && <button type="button" className="btn" onClick={onRetry}>Thử lại</button>}
      </div>
    );
  }
  if (view === 'empty') return emptyContent ?? <div className="state state-empty">{emptyMessage}</div>;
  return typeof children === 'function' ? children(state.data) : children;
}
