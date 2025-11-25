# Stage 1: Build
FROM node:20-alpine as builder

# Nhận biến PUBLIC_PATH từ build args
ARG PUBLIC_PATH=/

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

# Tạo file .env tạm thời để Vite đọc được PUBLIC_PATH
RUN echo "PUBLIC_PATH=${PUBLIC_PATH}" > .env.production

# Build app
RUN npm run build

# Stage 2: Serve
FROM nginx:1.25-alpine

# Copy build artifacts
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
