require('dotenv').config();

// Đọc cấu hình từ biến môi trường (không hard-code mật khẩu – NFR06)
const config = {
  port: Number(process.env.PORT) || 3000,
  db: process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME || 'smartcrm',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
      },
  // Đăng nhập (TD-14): bí mật ký token lấy từ môi trường; không có thì sinh ngẫu nhiên mỗi lần khởi động
  // (token cũ tự hết hiệu lực khi khởi động lại – giao diện sẽ nhận 401 và quay về trang đăng nhập).
  auth: {
    secret: process.env.AUTH_SECRET || require('node:crypto').randomBytes(32).toString('hex'),
    secretFromEnv: Boolean(process.env.AUTH_SECRET),
    tokenTtlSeconds: Number(process.env.TOKEN_TTL_SECONDS) || 8 * 60 * 60,
    demoPassword: process.env.DEMO_PASSWORD || 'demo123',
  },
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim()).filter(Boolean),
  openTicketWarnThreshold: 10, // QT-06
  minSuggestProficiency: 3, // QT-03
};

module.exports = config;
