'use strict';

const fs = require('fs');
const http = require('http');

const out = process.env.ALERT_EVIDENCE || 'alert-evidence.jsonl';
const port = Number(process.env.ALERT_PORT || 3100);

const server = http.createServer((req, res) => {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end();
  }

  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', () => {
    fs.appendFileSync(out, body + '\n');
    res.statusCode = 204;
    res.end();
  });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`alert receiver on ${port}`);
});
