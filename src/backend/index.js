const config = require('./src/config');
const { pool, withTransaction } = require('./src/db');
const ticketRepo = require('./src/repositories/ticketRepository');
const technicianRepo = require('./src/repositories/technicianRepository');
const centerRepo = require('./src/repositories/centerRepository');
const logRepo = require('./src/repositories/ticketLogRepository');
const appointmentRepo = require('./src/repositories/appointmentRepository');
const { createTicketService } = require('./src/services/ticketService');
const { createAuthService } = require('./src/services/authService');
const { DEMO_ACCOUNTS, buildUsers } = require('./src/auth/users');
const { createApp } = require('./src/app');
const fs = require('node:fs');
const path = require('node:path');

// Thư mục giao diện đã build (có trong image Docker; khi chạy dev thì không có và bị bỏ qua)
const webDist = path.join(__dirname, '..', 'frontend', 'dist');
const staticDir = fs.existsSync(path.join(webDist, 'index.html')) ? webDist : null;

const ticketService = createTicketService({ ticketRepo, technicianRepo, logRepo, centerRepo, appointmentRepo, db: pool, withTransaction, config });
const authService = createAuthService({
  users: buildUsers(DEMO_ACCOUNTS, config.auth.demoPassword),
  secret: config.auth.secret,
  ttlSeconds: config.auth.tokenTtlSeconds,
  technicianRepo,
  db: pool,
});
const app = createApp({ ticketService, authService, checkDb: () => pool.query('SELECT 1'), corsOrigins: config.corsOrigins, staticDir });

app.listen(config.port, () => {
  console.log(`Mekong L4 API chạy tại http://localhost:${config.port}`);
  if (!config.auth.secretFromEnv) console.log('Lưu ý: chưa đặt AUTH_SECRET trong .env – token sẽ mất hiệu lực mỗi lần khởi động lại.');
});
