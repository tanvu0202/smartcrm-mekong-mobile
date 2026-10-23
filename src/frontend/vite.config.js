import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Giao diện gọi '/api/...' (cùng origin); Vite chuyển tiếp sang backend nên không vướng CORS khi chạy dev.
// Backend ở cổng khác thì đặt VITE_API_PROXY trong src/frontend/.env (xem .env.example).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_API_PROXY || 'http://localhost:3000';
  return {
    plugins: [react()],
    server: { port: 5173, proxy: { '/api': { target, changeOrigin: true } } },
    preview: { port: 5173, proxy: { '/api': { target, changeOrigin: true } } },
    build: { outDir: 'dist', sourcemap: mode !== 'production' },
  };
});
