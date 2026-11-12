# Smart CRM – Mekong Mobile (luồng L4). Một image chứa cả API (Express) và giao diện đã build (React).
# Dựng:  docker compose up -d --build     (xem docs/deployment-guide.md)

# ---- Giai đoạn 1: build giao diện React (cần devDependencies: vite) ----
FROM node:22-alpine AS web
WORKDIR /web
# Chép tệp khoá trước -> chỉ cài lại thư viện khi package-lock.json đổi (tận dụng cache)
COPY src/frontend/package.json src/frontend/package-lock.json ./
RUN npm ci
COPY src/frontend ./
RUN npm run build

# ---- Giai đoạn 2: image chạy thật ----
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Mã nguồn, migration + dữ liệu mẫu, bộ test (để chạy `docker compose exec app npm test` trong container)
COPY src/backend ./src/backend
COPY db ./db
COPY scripts ./scripts
COPY tests ./tests
# Các test của giao diện (tests/frontend) import trực tiếp mã trong src/frontend/src (không cần thư viện React)
COPY src/frontend/package.json ./src/frontend/package.json
COPY src/frontend/src ./src/frontend/src
COPY --from=web /web/dist ./src/frontend/dist

# Không chạy bằng root
USER node
EXPOSE 3000

# Khi khởi động: chạy migration (tạo bảng + nạp dữ liệu mẫu; chạy lại an toàn) rồi mới bật API
CMD ["sh", "-c", "node src/backend/scripts/migrate.js && node src/backend/index.js"]
