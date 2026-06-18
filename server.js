// 의존성 없는 정적 파일 서버 (Railway/로컬 공용)
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;
const TYPES = {
  '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8',
  '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.png':'image/png', '.svg':'image/svg+xml',
  '.ico':'image/x-icon', '.webp':'image/webp', '.gif':'image/gif'
};

http.createServer((req, res) => {
  let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  // 디렉터리 트래버설 방지
  const filePath = path.normalize(path.join(ROOT, urlPath));
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      // SPA 아님: 없는 경로는 index.html로 폴백하지 않고 404
      res.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'});
      return res.end('Not found');
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {'Content-Type': TYPES[ext] || 'application/octet-stream'});
    res.end(data);
  });
}).listen(PORT, () => console.log('LIMINAL SPACE serving on :' + PORT));
