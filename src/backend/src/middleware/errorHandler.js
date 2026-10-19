const { AppError } = require('../errors');

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
  console.error(err);
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Lỗi hệ thống' } });
}
module.exports = { errorHandler };
