class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
const badRequest = (m, d) => new AppError(400, 'VALIDATION_ERROR', m, d);
const notFound = (m) => new AppError(404, 'NOT_FOUND', m);
const conflict = (m, code = 'CONFLICT') => new AppError(409, code, m);
const unprocessable = (m, code = 'BUSINESS_RULE') => new AppError(422, code, m);
module.exports = { AppError, badRequest, notFound, conflict, unprocessable };
