const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const port = process.env.APP_PORT || 3000;
const mongoUri = process.env.MONGODB_URI;

// Endpoint 1: Hello Smart CRM
app.get('/', (req, res) => {
  res.send('Hello Smart CRM');
});

// Endpoint 2: Kiểm tra kết nối CSDL MongoDB
app.get('/db-check', (req, res) => {
  const state = mongoose.connection.readyState;
  if (state === 1) {
    res.json({
      status: 'OK',
      database: 'MongoDB Atlas',
      server_time: new Date()
    });
  } else {
    res.status(500).json({
      status: 'ERROR',
      message: 'MongoDB chưa kết nối thành công (State: ' + state + ')'
    });
  }
});

// Kết nối MongoDB trước, kết nối được mới bật Server
console.log('Dang ket noi toi MongoDB...');
mongoose.connect(mongoUri)
  .then(() => {
    console.log('Da ket noi thanh cong toi MongoDB Atlas!');
    app.listen(port, () => {
      console.log('Server chay tai http://localhost:' + port);
    });
  })
  .catch((err) => {
    console.error('Loi ket noi MongoDB:', err.message);
  });