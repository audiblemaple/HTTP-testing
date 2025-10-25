const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

// Accept JSON, text, or form data
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.text({ type: '*/*', limit: '1mb' }));

// Middleware to log full request details
app.use((req, res, next) => {
  console.log('--- Incoming Request ---');
  console.log(`Method: ${req.method}`);
  console.log(`URL: ${req.originalUrl}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('------------------------\n');
  next();
});

// Health / sanity endpoint
app.get('/', (req, res) => {
  let body = req.body;
  res.json({
    you_sent: body,
    method: 'POST',
    headers: req.headers,
  });
});

app.get('/echo', (req, res) => {
  const { msg } = req.query;
  res.json({
    you_sent: msg ?? null,
    method: 'GET',
  });
});

app.post('/echo', (req, res) => {
  let body = req.body;
  res.json({
    you_sent: body,
    method: 'POST',
    headers: req.headers,
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    hint: 'Use /echo or / via GET or POST',
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Echo server listening on port ${PORT}`);
});
