// echo_server.js
const net = require('net');

const PORT = 8080;
const HOST = '0.0.0.0';

const server = net.createServer((socket) => {
  console.log(`Client connected: ${socket.remoteAddress}:${socket.remotePort}`);

  socket.on('data', (data) => {
    console.log(`Received: ${data.toString().trim()}`);
    socket.write(`Echo: ${data}`);
  });

  socket.on('close', () => {
    console.log(`Client disconnected: ${socket.remoteAddress}:${socket.remotePort}`);
  });

  socket.on('error', (err) => {
    console.error(`Socket error: ${err.message}`);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Echo server listening on ${HOST}:${PORT}`);
});
