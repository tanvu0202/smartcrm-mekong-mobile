const config = require('./src/config');
const { pool, withTransaction } = require('./src/db');
const ticketRepo = require('./src/repositories/ticketRepository');
const technicianRepo = require('./src/repositories/technicianRepository');
const logRepo = require('./src/repositories/ticketLogRepository');
const { createTicketService } = require('./src/services/ticketService');
const { createApp } = require('./src/app');

const ticketService = createTicketService({ ticketRepo, technicianRepo, logRepo, db: pool, withTransaction, config });
const app = createApp({ ticketService, checkDb: () => pool.query('SELECT 1') });

app.listen(config.port, () => console.log(`Mekong L4 API chạy tại http://localhost:${config.port}`));
