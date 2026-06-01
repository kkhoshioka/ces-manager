const http = require('http');

const data = JSON.stringify({ year: 2026, month: 5 });

const req = http.request(
  'http://localhost:3000/api/inventory/snapshot',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  },
  (res) => {
    let responseData = '';
    res.on('data', chunk => responseData += chunk);
    res.on('end', () => console.log('POST Response:', responseData));
  }
);

req.write(data);
req.end();
