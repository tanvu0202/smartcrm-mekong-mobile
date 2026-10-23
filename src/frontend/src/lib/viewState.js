// Quyết định giao diện đang ở trạng thái nào – hàm thuần để kiểm thử, dùng bởi <DataState>.
// 'loading' → 'error' → 'empty' → 'ready' (thứ tự ưu tiên).
export const defaultIsEmpty = (data) =>
  data === null || data === undefined || (Array.isArray(data) && data.length === 0);

export function resolveViewState({ loading, error, data, isEmpty = defaultIsEmpty }) {
  if (loading) return 'loading';
  if (error) return 'error';
  if (isEmpty(data)) return 'empty';
  return 'ready';
}
