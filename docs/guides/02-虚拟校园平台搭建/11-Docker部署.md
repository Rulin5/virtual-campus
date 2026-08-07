# Phase 2 第 11 章：Docker 部署 — 一键启动整个项目

> **本章目标**：编写完整的 `docker-compose.yml`，包含前端、后端、数据库、缓存、存储和反向代理，一条命令启动全部服务。
>
> **预计时间**：2-3 小时

---

## 11.1 最终部署架构

```
浏览器 → Nginx(:80)
           ├── /              → React 前端 (静态文件)
           ├── /game/         → Phaser 游戏前端 (静态文件)
           ├── /admin/        → 后台管理 (静态文件)
           ├── /api/*         → Go API (:8080)
           └── /ws            → WebSocket (:8080)

Go API → PostgreSQL(:5432) + Redis(:6379) + MinIO(:9000)
```

---

## 11.2 完整 docker-compose.yml

`deployment/docker-compose.yml`：

```yaml
version: '3.8'

services:
  # ===== 反向代理 =====
  nginx:
    image: nginx:alpine
    container_name: vc-nginx
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ../apps/web/dist:/usr/share/nginx/html/web:ro
      - ../apps/game:/usr/share/nginx/html/game:ro
      - ../apps/admin/dist:/usr/share/nginx/html/admin:ro
    depends_on:
      - api

  # ===== Go API =====
  api:
    build:
      context: ../apps/server
      dockerfile: Dockerfile
    container_name: vc-api
    environment:
      PORT: "8080"
      DATABASE_URL: "postgres://vc_user:vc_password@postgres:5432/virtual_campus?sslmode=disable"
      REDIS_URL: "redis:6379"
      JWT_SECRET: "${JWT_SECRET:-change-me-in-production}"
    depends_on:
      - postgres
      - redis

  # ===== PostgreSQL =====
  postgres:
    image: postgres:16-alpine
    container_name: vc-postgres
    environment:
      POSTGRES_USER: vc_user
      POSTGRES_PASSWORD: vc_password
      POSTGRES_DB: virtual_campus
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql

  # ===== Redis =====
  redis:
    image: redis:7-alpine
    container_name: vc-redis

  # ===== MinIO 对象存储 =====
  minio:
    image: minio/minio
    container_name: vc-minio
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9001:9001"
    command: server /data --console-address ":9001"
    volumes:
      - miniodata:/data

volumes:
  pgdata:
  miniodata:
```

---

## 11.3 Nginx 配置

`deployment/nginx.conf`：

```nginx
events { worker_connections 1024; }

http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile      on;

    # ===== Go API 反向代理 =====
    upstream api {
        server api:8080;
    }

    server {
        listen 80;

        # React 平台前端
        location / {
            root /usr/share/nginx/html/web;
            try_files $uri /index.html;
        }

        # Phaser 游戏前端
        location /game/ {
            alias /usr/share/nginx/html/game/;
            try_files $uri /game/index.html;
        }

        # 后台管理
        location /admin/ {
            alias /usr/share/nginx/html/admin/;
            try_files $uri /admin/index.html;
        }

        # API
        location /api/ {
            proxy_pass http://api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # WebSocket
        location /ws {
            proxy_pass http://api;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
        }
    }
}
```

---

## 11.4 Go Dockerfile

`apps/server/Dockerfile`：

```dockerfile
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o server ./cmd/main.go

FROM alpine:latest
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=builder /app/server .
EXPOSE 8080
CMD ["./server"]
```

---

## 11.5 前端构建

部署前需要构建前端：

```bash
# React 平台前端
cd apps/web && pnpm build
# 输出到 apps/web/dist/

# 后台管理
cd apps/admin && pnpm build
# 输出到 apps/admin/dist/

# 游戏前端是纯静态 HTML，不需要构建
```

---

## 11.6 启动流程

```bash
# 1. 构建前端
cd apps/web && pnpm build
cd apps/admin && pnpm build

# 2. 启动所有服务
cd deployment
docker compose up -d

# 3. 查看日志
docker compose logs -f api

# 4. 检查状态
docker compose ps

# 5. 验证
curl http://localhost/api/health
# → {"status":"ok","database":"connected"}

# 6. 浏览器访问
# http://localhost          → 平台前端
# http://localhost/game/    → 游戏
# http://localhost/admin/   → 后台管理
```

---

## 11.7 常用命令

```bash
docker compose up -d              # 启动
docker compose down               # 停止并删除容器
docker compose down -v            # 停止并删除容器+数据卷（⚠️ 数据会丢失）
docker compose restart api        # 重启单个服务
docker compose logs -f api        # 查看 API 日志
docker compose exec postgres psql -U vc_user -d virtual_campus  # 进入数据库
```

---

## 11.8 生产环境注意事项

1. **JWT_SECRET**：必须改为随机字符串，不要用默认值
2. **数据库密码**：使用 Docker secrets 或环境变量文件 `.env`
3. **HTTPS**：添加 Let's Encrypt 证书（可以用 Certbot 或 Traefik）
4. **日志**：接入 Loki 或 ELK 做日志采集
5. **监控**：Prometheus + Grafana

---

## 11.9 下一章

[第 12 章：测试与验收](12-测试与验收.md)
