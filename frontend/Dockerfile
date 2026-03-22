FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

# ─── Nginx Serve ──────────────────────────────────────────────────────────────
FROM nginx:alpine

COPY --from=builder /app/build /usr/share/nginx/html

# Nginx config for React SPA (handles client-side routing)
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
