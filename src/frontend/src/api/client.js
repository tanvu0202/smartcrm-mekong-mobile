// L1 – Máy khách HTTP duy nhất của giao diện. Mọi lời gọi mạng đi qua đây; trang (pages/) không được gọi fetch trực tiếp.
// Việc của client: gắn token, ghép URL, đổi mọi lỗi (mạng, HTTP, JSON hỏng) thành ApiError có thông báo tiếng Việt,
// và khi nhận 401 thì xoá token rồi báo cho ứng dụng đưa người dùng về trang đăng nhập.

const TOKEN_KEY = 'mekong.token';
const USER_KEY = 'mekong.user';

// localStorage có thể không dùng được (chế độ riêng tư, môi trường test) → lùi về bộ nhớ trong.
const memory = new Map();
function store(op, key, value) {
  try {
    const ls = globalThis.localStorage;
    if (ls) {
      if (op === 'set') ls.setItem(key, value);
      else if (op === 'del') ls.removeItem(key);
      else return ls.getItem(key);
      return undefined;
    }
  } catch { /* rơi xuống bộ nhớ trong */ }
  if (op === 'set') memory.set(key, value);
  else if (op === 'del') memory.delete(key);
  else return memory.has(key) ? memory.get(key) : null;
  return undefined;
}

export const session = {
  getToken: () => store('get', TOKEN_KEY),
  getUser() {
    try { return JSON.parse(store('get', USER_KEY) || 'null'); } catch { return null; }
  },
  save(token, user) { store('set', TOKEN_KEY, token); store('set', USER_KEY, JSON.stringify(user)); },
  clear() { store('del', TOKEN_KEY); store('del', USER_KEY); },
};

export class ApiError extends Error {
  constructor({ status = 0, code = 'UNKNOWN', message = 'Có lỗi xảy ra', details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
  get isNetwork() { return this.code === 'NETWORK' || this.code === 'SERVER_UNAVAILABLE'; }
}

let onUnauthorized = null;
/** Ứng dụng đăng ký hàm này để đưa người dùng về trang đăng nhập khi phiên hết hạn. */
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

const baseUrl = () => (import.meta.env && import.meta.env.VITE_API_BASE_URL) || '/api';

export function buildUrl(path, query) {
  const qs = new URLSearchParams();
  Object.entries(query || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.append(k, String(v));
  });
  const s = qs.toString();
  return `${baseUrl().replace(/\/+$/, '')}${path}${s ? `?${s}` : ''}`;
}

/**
 * Gọi API. auth=false cho endpoint công khai (đăng nhập): 401 ở đó là "sai mật khẩu", không phải "hết phiên".
 * Trả về phần JSON của phản hồi (204 → null).
 */
export async function request(path, { method = 'GET', query, body, auth = true } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = auth ? session.getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(buildUrl(path, query), { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiError({ status: 0, code: 'NETWORK', message: 'Không kết nối được máy chủ. Hãy kiểm tra backend đã chạy chưa rồi thử lại.' });
  }

  if (res.status === 204) return null;
  let payload = null;
  try { payload = await res.json(); } catch { /* phản hồi không phải JSON (ví dụ proxy báo backend sập) */ }

  if (res.ok) {
    if (payload === null) throw new ApiError({ status: res.status, code: 'BAD_RESPONSE', message: 'Máy chủ trả về dữ liệu không đọc được.' });
    return payload;
  }

  if (payload === null || !payload.error) {
    throw new ApiError({
      status: res.status,
      code: res.status >= 500 ? 'SERVER_UNAVAILABLE' : 'BAD_RESPONSE',
      message: res.status >= 500 ? `Máy chủ không phản hồi (HTTP ${res.status}). Hãy thử lại sau.` : `Phản hồi không hợp lệ (HTTP ${res.status}).`,
    });
  }
  const err = new ApiError({ status: res.status, ...payload.error });
  if (res.status === 401 && auth) {
    session.clear();
    if (onUnauthorized) onUnauthorized(err);
  }
  throw err;
}

export const get = (path, query) => request(path, { query });
export const post = (path, body, opts) => request(path, { method: 'POST', body, ...opts });
