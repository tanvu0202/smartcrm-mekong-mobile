// L3 – Nghiệp vụ đăng nhập: kiểm tra tài khoản, cấp và kiểm tra token. Không biết gì về HTTP.
const { badRequest, unauthorized } = require('../errors');
const { signToken, verifyToken, TokenError } = require('../auth/token');
const { verifyPassword } = require('../auth/users');

function createAuthService({ users, secret, ttlSeconds, technicianRepo, db, now = () => Date.now() }) {
  return {
    async login(input = {}) {
      const { username, password } = input;
      if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password) {
        throw badRequest('Nhập tên đăng nhập và mật khẩu');
      }
      const user = users.find((u) => u.username === username.trim().toLowerCase());
      if (!verifyPassword(user, password)) throw unauthorized('Sai tên đăng nhập hoặc mật khẩu', 'INVALID_CREDENTIALS');

      let technicianId = null;
      let fullName = user.fullName;
      if (user.role === 'KTV') {
        const tech = await technicianRepo.findByPhone(db, user.technicianPhone);
        if (!tech || !tech.is_active) throw unauthorized('Tài khoản kỹ thuật viên không còn hiệu lực', 'ACCOUNT_DISABLED');
        technicianId = tech.technician_id;
        fullName = tech.full_name;
      }
      const token = signToken({ sub: user.username, role: user.role, tid: technicianId, name: fullName }, secret,
        { ttlSeconds, nowMs: now() });
      return { token, expiresIn: ttlSeconds, user: { username: user.username, fullName, role: user.role, technicianId } };
    },

    /** Header "Authorization: Bearer <token>" → thông tin người dùng, hoặc ném 401. */
    authenticate(header) {
      const m = /^Bearer\s+(\S+)$/i.exec(typeof header === 'string' ? header.trim() : '');
      if (!m) throw unauthorized('Chưa đăng nhập');
      try {
        const p = verifyToken(m[1], secret, now());
        return { username: p.sub, role: p.role, technicianId: p.tid ?? null, fullName: p.name };
      } catch (err) {
        if (err instanceof TokenError) {
          throw unauthorized(err.code === 'TOKEN_EXPIRED' ? 'Phiên đăng nhập đã hết hạn' : 'Phiên đăng nhập không hợp lệ',
            err.code === 'TOKEN_EXPIRED' ? 'TOKEN_EXPIRED' : 'UNAUTHENTICATED');
        }
        throw err;
      }
    },
  };
}

module.exports = { createAuthService };
