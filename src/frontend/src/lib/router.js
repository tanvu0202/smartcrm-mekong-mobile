// Bộ định tuyến theo hash (#/queue, #/tickets/12 ...) – không cần thư viện ngoài.
export const ROUTES = [
  { name: 'login', pattern: '/login' },
  { name: 'queue', pattern: '/queue' },
  { name: 'ticket', pattern: '/tickets/:id' },
  { name: 'my', pattern: '/my' },
];

/** '#/tickets/12?x=1' → { name:'ticket', params:{id:'12'} }; không khớp → { name:'notfound', params:{} }. */
export function matchRoute(hash, routes = ROUTES) {
  const path = String(hash || '').replace(/^#/, '').split('?')[0].replace(/\/+$/, '') || '/';
  for (const r of routes) {
    const names = [];
    const re = new RegExp('^' + r.pattern.replace(/:(\w+)/g, (_, k) => { names.push(k); return '([^/]+)'; }) + '$');
    const m = re.exec(path);
    if (m) return { name: r.name, params: Object.fromEntries(names.map((k, i) => [k, decodeURIComponent(m[i + 1])])) };
  }
  return { name: 'notfound', params: {} };
}

/** Trang đầu theo vai trò sau khi đăng nhập. */
export const homeFor = (role) => (role === 'KTV' ? '#/my' : '#/queue');
