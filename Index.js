// server.js
const express = require('express');
const app = express();

// Render will inject PORT into the env. Fallback is helpful for local dev.
const PORT = process.env.PORT || 3000;

// Accept JSON, text, or form data
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.text({ type: '*/*', limit: '1mb' }));

// Health / sanity endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Echo server is running',
    usage: {
      GET_echo: '/echo?msg=hello',
      POST_echo: '/echo  (send JSON, text, or form data)',
    },
  });
});

// Echo via GET:
//   /echo?msg=hello
app.get('/echo', (req, res) => {
  const { msg } = req.query;
  res.json({
    you_sent: msg ?? null,
    method: 'GET',
  });
});

// Echo via POST:
// - If you send JSON:    { "foo": 123 }
// - If you send text:    "hello world"
// - If you send form:    foo=123&bar=ok
app.post('/echo', (req, res) => {
  // Try to be smart about what the client sent
  let body = req.body;

  // express.text() will give you a string, but express.json() / urlencoded()
  // will give you an object. Both are fine. We'll return it as-is.
  res.json({
    you_sent: body,
    method: 'POST',
    headers: req.headers,
  });
});

// Basic 404 handler (nice to have so Render doesn't think it's crashing)
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    hint: 'Use /echo or / via GET or POST',
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Echo server listening on port ${PORT}`);
});
