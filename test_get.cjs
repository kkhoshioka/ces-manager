const http = require('http');

const req = http.request(
  'http://localhost:3000/api/inventory/snapshot/2026/5/pdf',
  { method: 'GET' },
  (res) => {
    console.log('Status:', res.statusCode);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log('Data length:', data.length, 'Data snippet:', data.substring(0, 100)));
  }
);
req.end();
