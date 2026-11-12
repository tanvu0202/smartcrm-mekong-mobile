const { AppError } = require('../errors');

const DB_DOWN_CODES = new Set(['ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN', 'ETIMEDOUT', 'ECONNRESET', '57P01', '57P03', '08006', '08001']);
/** Lỗi do không nối được CSDL (chết, quá thời gian chờ kết nối, đang tắt). */
function isDbUnavailable(err) {
  return DB_DOWN_CODES.has(err.code)
    || /timeout exceeded when trying to connect|Connection terminated|connect ECONNREFUSED/i.test(err.message || '');
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'JSON không hợp lệ' } });
  }
  if (err.code === '23503' || err.code === '23514' || err.code === '23505') { // vi phạm ràng buộc DB
    return res.status(422).json({ error: { code: 'DB_CONSTRAINT', message: err.detail || err.message } });
  }
  if (err.code === '22P02') { // sai kiểu dữ liệu (ví dụ center_id=abc)
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Tham số sai kiểu dữ liệu' } });
  }
  if (isDbUnavailable(err)) { // không lộ chi tiết kết nối; chỉ ghi mã lỗi vào log
    console.error('CSDL không khả dụng:', err.code || err.message);
    return res.status(503).json({ error: { code: 'DB_UNAVAILABLE', message: 'Hệ thống tạm thời không kết nối được cơ sở dữ liệu, vui lòng thử lại sau' } });
  }
  console.error(err);
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Lỗi hệ thống' } });
}
module.exports = { errorHandler, isDbUnavailable };
