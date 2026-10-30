const express = require('express');
const { createTicketController } = require('./controllers/ticketController');
const { createAuthController } = require('./controllers/authController');
const { createLookupController } = require('./controllers/lookupController');
const { createTicketRoutes } = require('./routes/ticketRoutes');
const { createLookupRoutes } = require('./routes/lookupRoutes');
const { createAppointmentRoutes } = require('./routes/appointmentRoutes');
const { requireAuth, requireRole } = require('./middleware/auth');
const { cors } = require('./middleware/cors');
const { errorHandler } = require('./middleware/errorHandler');

/** Lắp ráp ứng dụng từ service đã dựng sẵn (để test không cần DB). */
function createApp({ ticketService, authService, checkDb, corsOrigins = [] }) {
  const app = express();
  app.use(cors(corsOrigins));
  app.use(express.json());

  // Công khai: kiểm tra sức khỏe và đăng nhập
  app.get('/api/health', async (req, res) => {
    try { if (checkDb) await checkDb(); res.json({ status: 'ok', db: checkDb ? 'up' : 'n/a' }); }
    catch { res.status(503).json({ status: 'degraded', db: 'down' }); }
  });
  const authController = createAuthController(authService);
  app.post('/api/auth/login', authController.login);

  // Từ đây trở xuống bắt buộc có token hợp lệ (thiếu/sai/hết hạn → 401)
  const auth = requireAuth(authService);
  const requireManager = requireRole('QUAN_LY');
  app.get('/api/auth/me', auth, authController.me);
  const ticketController = createTicketController(ticketService);
  app.use('/api/tickets', auth, createTicketRoutes(ticketController, { requireManager }));
  app.use('/api/appointments', auth, createAppointmentRoutes(ticketController, { requireManager }));
  app.use('/api', auth, createLookupRoutes(createLookupController(ticketService), { requireManager }));

  app.use((req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Không có route này' } }));
  app.use(errorHandler);
  return app;
}
module.exports = { createApp };
