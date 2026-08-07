# Phase 2 第 3 章：Go API 骨架

> **本章目标**：搭建 Go 后端项目的分层架构，跑通第一个数据库查询接口。
>
> **预计时间**：2-3 小时

---

## 3.1 Go 项目分层

```
请求 → handler/ → service/ → repository/ → PostgreSQL
         ↑            ↑           ↑
      HTTP 层     业务逻辑层    数据访问层
  (解析参数)    (处理规则)    (操作数据库)
```

---

## 3.2 文件清单

```
apps/server/
├── cmd/main.go                    ← 入口
├── internal/
│   ├── config/config.go           ← 从环境变量读配置
│   ├── repository/db.go           ← 数据库连接
│   ├── repository/user.go         ← 用户数据访问
│   ├── service/auth.go            ← 认证业务逻辑
│   ├── handler/health.go          ← 健康检查接口
│   ├── handler/auth.go            ← 登录/注册接口
│   └── middleware/
│       ├── cors.go                ← CORS 跨域
│       └── jwt.go                 ← JWT Token 验证
├── go.mod
└── go.sum
```

---

## 3.3 核心代码

### config.go

```go
package config

import "os"

type Config struct {
    Port        string
    DatabaseURL string
    RedisURL    string
    JWTSecret   string
}

func Load() *Config {
    return &Config{
        Port:        getEnv("PORT", "8080"),
        DatabaseURL: getEnv("DATABASE_URL", "postgres://vc_user:vc_password@localhost:5432/virtual_campus?sslmode=disable"),
        RedisURL:    getEnv("REDIS_URL", "localhost:6379"),
        JWTSecret:   getEnv("JWT_SECRET", "dev-secret-change-in-production"),
    }
}

func getEnv(key, fallback string) string {
    if v := os.Getenv(key); v != "" { return v }
    return fallback
}
```

### repository/db.go

```go
package repository

import (
    "database/sql"
    "fmt"
    "log"
    _ "github.com/lib/pq"
)

var DB *sql.DB

func Connect(dsn string) error {
    var err error
    DB, err = sql.Open("postgres", dsn)
    if err != nil { return fmt.Errorf("open: %w", err) }
    if err = DB.Ping(); err != nil { return fmt.Errorf("ping: %w", err) }
    log.Println("✅ DB connected")
    return nil
}
```

### middleware/cors.go

```go
package middleware

import "github.com/gin-gonic/gin"

func CORS() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Header("Access-Control-Allow-Origin", "*")
        c.Header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
        c.Header("Access-Control-Allow-Headers", "Content-Type,Authorization")
        if c.Request.Method == "OPTIONS" { c.AbortWithStatus(204); return }
        c.Next()
    }
}
```

### handler/health.go

```go
package handler

import (
    "net/http"
    "github.com/gin-gonic/gin"
    "virtual-campus-server/internal/repository"
)

func HealthCheck(c *gin.Context) {
    dbOk := "connected"
    if err := repository.DB.Ping(); err != nil { dbOk = "disconnected" }
    c.JSON(http.StatusOK, gin.H{"status": "ok", "database": dbOk})
}
```

### cmd/main.go

```go
package main

import (
    "fmt"
    "log"
    "github.com/gin-gonic/gin"
    "virtual-campus-server/internal/config"
    "virtual-campus-server/internal/handler"
    "virtual-campus-server/internal/middleware"
    "virtual-campus-server/internal/repository"
)

func main() {
    cfg := config.Load()
    if err := repository.Connect(cfg.DatabaseURL); err != nil {
        log.Fatalf("❌ DB: %v", err)
    }
    defer repository.DB.Close()

    r := gin.Default()
    r.Use(middleware.CORS())

    api := r.Group("/api")
    api.GET("/health", handler.HealthCheck)

    addr := fmt.Sprintf(":%s", cfg.Port)
    log.Printf("🚀 http://localhost%s", addr)
    r.Run(addr)
}
```

---

## 3.4 运行验证

```bash
cd apps/server
go run cmd/main.go
# 🚀 http://localhost:8080

# 另一个终端测试：
curl http://localhost:8080/api/health
# {"database":"connected","status":"ok"}
```

---

## 3.5 下一章

[第 4 章：用户系统 — 注册、登录、JWT](04-用户系统.md)
