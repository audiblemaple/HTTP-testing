const http = require('http');

const hostname = '0.0.0.0'; // Listen on all network interfaces
const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    console.log(`Received request: ${req.method} ${req.url}`);

    // Set a 200 OK status and JSON content type
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');

    // Create a simple JSON response
    const response = {
        message: 'Hello from Node.js HTTP Server!',
        path: req.url,
        method: req.method
    };

    // Send the response
    res.end(JSON.stringify(response));
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
