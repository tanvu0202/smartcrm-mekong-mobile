const express = require('express');
const { createTicketController } = require('./controllers/ticketController');
const { createTicketRoutes } = require('./routes/ticketRoutes');
const { errorHandler } = require('./middleware/errorHandler');

/** Lắp ráp ứng dụng từ service đã dựng sẵn (để test không cần DB). */
function createApp({ ticketService, checkDb }) {
  const app = express();
  app.use(express.json());
  app.get('/api/health', async (req, res) => {
    try { if (checkDb) await checkDb(); res.json({ status: 'ok', db: checkDb ? 'up' : 'n/a' }); }
    catch { res.status(503).json({ status: 'degraded', db: 'down' }); }
  });
  app.use('/api/tickets', createTicketRoutes(createTicketController(ticketService)));
  app.use((req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Không có route này' } }));
  app.use(errorHandler);
  return app;
}
module.exports = { createApp };
