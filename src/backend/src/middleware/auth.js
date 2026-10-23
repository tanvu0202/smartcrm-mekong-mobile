const { forbidden } = require('../errors');

/** Bắt buộc có token hợp lệ; gắn req.user = { username, role, technicianId, fullName }. Thiếu/sai/hết hạn → 401. */
function requireAuth(authService) {
  return (req, res, next) => {
    try {
      req.user = authService.authenticate(req.headers.authorization);
      next();
    } catch (err) { next(err); }
  };
}

/** Chỉ cho các vai trò liệt kê đi tiếp; sai vai trò → 403. Phải đặt sau requireAuth. */
function requireRole(...roles) {
  return (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) return next();
    return next(forbidden('Bạn không có quyền thực hiện thao tác này'));
  };
}

module.exports = { requireAuth, requireRole };
