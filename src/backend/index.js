require('dotenv').config();
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello Smart CRM');
});

const port = process.env.APP_PORT || 3000;
app.listen(port, () => {
  console.log('Server chay tai http://localhost:' + port);
});