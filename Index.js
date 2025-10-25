const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

// Accept JSON, text, or form data
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.text({ type: '*/*', limit: '1mb' }));

// Handle ALL requests (GET, POST, PUT, DELETE, etc.) on the root URL
app.all('/', (req, res) => {
  console.log('--- Incoming Request ---');
  console.log(`Method: ${req.method}`);
  console.log(`URL: ${req.originalUrl}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('------------------------\n');

  res.json({
    received: true,
    method: req.method,
    url: req.originalUrl,
    headers: req.headers,
    body: req.body,
  });
});

// Basic 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    hint: 'Send requests to /',
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});
