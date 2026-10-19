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
  openTicketWarnThreshold: 10, // QT-06
  minSuggestProficiency: 3, // QT-03
};

module.exports = config;
