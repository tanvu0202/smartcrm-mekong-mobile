// Token đăng nhập dạng JWT-HS256 tự dựng bằng node:crypto (không thêm thư viện ngoài).
// Cấu trúc: base64url(header).base64url(payload).base64url(chữ ký HMAC-SHA256).
const crypto = require('node:crypto');

const b64 = (data) => Buffer.from(data).toString('base64url');
const hmac = (data, secret) => crypto.createHmac('sha256', secret).update(data).digest();

class TokenError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code; // 'TOKEN_INVALID' | 'TOKEN_EXPIRED'
  }
}

/** Ký token. claims: dữ liệu nghiệp vụ (sub, role, ...). exp tính bằng giây Unix. */
function signToken(claims, secret, { ttlSeconds, nowMs = Date.now() }) {
  if (!secret) throw new Error('Thiếu AUTH_SECRET');
  if (!Number.isFinite(ttlSeconds) || ttlSeconds <= 0) throw new Error('ttlSeconds phải > 0');
  const iat = Math.floor(nowMs / 1000);
  const head = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64(JSON.stringify({ ...claims, iat, exp: iat + ttlSeconds }));
  return `${head}.${body}.${b64(hmac(`${head}.${body}`, secret))}`;
}

/** Kiểm tra chữ ký và hạn; trả về payload hoặc ném TokenError. */
function verifyToken(token, secret, nowMs = Date.now()) {
  if (typeof token !== 'string') throw new TokenError('TOKEN_INVALID', 'Thiếu token');
  const parts = token.split('.');
  if (parts.length !== 3 || parts.some((p) => !p)) throw new TokenError('TOKEN_INVALID', 'Token sai định dạng');
  const [head, body, sig] = parts;
  const expected = hmac(`${head}.${body}`, secret);
  const given = Buffer.from(sig, 'base64url');
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) {
    throw new TokenError('TOKEN_INVALID', 'Chữ ký token không hợp lệ');
  }
  let payload;
  try { payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')); }
  catch { throw new TokenError('TOKEN_INVALID', 'Token sai định dạng'); }
  if (!payload || typeof payload.exp !== 'number') throw new TokenError('TOKEN_INVALID', 'Token thiếu hạn dùng');
  if (Math.floor(nowMs / 1000) >= payload.exp) throw new TokenError('TOKEN_EXPIRED', 'Token đã hết hạn');
  return payload;
}

module.exports = { signToken, verifyToken, TokenError };
