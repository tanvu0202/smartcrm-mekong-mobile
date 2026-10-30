// Proxy làm CHẬM API để chụp được trạng thái "Đang tải" (bình thường nó chỉ hiện vài mili giây).
// Không sửa mã ứng dụng: giao diện gọi proxy này, proxy chờ N mili giây rồi chuyển tiếp tới backend thật.
//
//   Terminal 1:  npm start                                   (backend, cổng 3000)
//   Terminal 2:  node scripts/proxy-cham.js 20000            (proxy cổng 3001, chậm 20 giây)
//   Terminal 3:  VITE_API_PROXY=http://localhost:3001 npm run web
//   Mở http://localhost:5173, đăng nhập, bấm Tải lại / chuyển trang → trong 20 giây thấy "Đang tải…" → chụp màn hình.
//   Chụp xong: Ctrl+C ở terminal 2 và 3, rồi chạy lại `npm run web` như bình thường.
const http = require('node:http');

const delayMs = Number(process.argv[2]) || 15000;
const target = { host: 'localhost', port: Number(process.env.BACKEND_PORT) || 3000 };
const listen = Number(process.env.PROXY_PORT) || 3001;

http.createServer((req, res) => {
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => setTimeout(() => {
    const up = http.request({ ...target, path: req.url, method: req.method, headers: req.headers }, (r) => {
      res.writeHead(r.statusCode, r.headers);
      r.pipe(res);
    });
    up.on('error', () => { res.writeHead(502, { 'Content-Type': 'application/json' }); res.end('{"error":{"code":"BAD_GATEWAY","message":"Backend không phản hồi"}}'); });
    up.end(Buffer.concat(chunks));
  }, delayMs));
}).listen(listen, () => console.log(`Proxy chậm ${delayMs / 1000} giây: http://localhost:${listen}  →  http://${target.host}:${target.port}`));
