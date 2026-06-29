const http = require('http');
const fs = require('fs');
const path = require('path');
const port = Number(process.argv[2]) || 4173;

const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
http.createServer((req, res) => {
  const pathname = req.url.split('?')[0];
  const requested = pathname === '/' || pathname.startsWith('/convite/') ? '/index.html' : pathname;
  const file = path.join(__dirname, requested);
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, {'Content-Type': types[path.extname(file)] || 'application/octet-stream'});
    res.end(data);
  });
}).listen(port, '127.0.0.1', () => console.log(`Combinado em http://127.0.0.1:${port}`));
