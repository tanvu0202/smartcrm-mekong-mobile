import { useCallback, useEffect, useState } from 'react';

/**
 * Chạy một hàm bất đồng bộ (trong api/*.api.js) và trả về { loading, error, data, reload }.
 * Dùng chung cho mọi trang để ba trạng thái (đang tải · rỗng · lỗi) được xử lý một kiểu.
 */
export function useApi(fn, deps = []) {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.resolve()
      .then(fn)
      .then(
        (data) => { if (alive) setState({ loading: false, error: null, data }); },
        (error) => { if (alive) setState({ loading: false, error, data: null }); },
      );
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}
