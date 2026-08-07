# Phase 2 第 1 章：Monorepo 搭建

> **本章目标**：用 pnpm + Turborepo 搭建 Monorepo 项目结构，一个 Git 仓库管理所有子项目。
>
> **预计时间**：1-2 小时

---

## 1.1 什么是 Monorepo？

```
传统方式（Multirepo）：          Monorepo：
frontend/  → git repo A          virtual-campus/  ← 一个 git repo
backend/   → git repo B            ├── apps/web/     (React 前端)
admin/     → git repo C            ├── apps/game/    (Phaser 游戏)
                                   ├── apps/server/  (Go 后端)
                                   ├── apps/admin/   (后台管理)
                                   └── packages/     (共享代码)
```

**好处**：一次 clone 所有代码、共享类型定义、统一构建。

---

## 1.2 创建项目结构

```bash
mkdir virtual-campus && cd virtual-campus
mkdir -p apps/web apps/game apps/server apps/admin
mkdir -p packages/shared-types packages/ui
mkdir -p deployment

git init
echo "node_modules/\ndist/\n.env" > .gitignore
```

---

## 1.3 初始化 pnpm workspace

创建 `pnpm-workspace.yaml`：
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

创建 `.npmrc`：
```
shamefully-hoist=true
strict-peer-dependencies=false
```

---

## 1.4 初始化各子项目

### 前端 (React + Vite)
```bash
cd apps/web
pnpm create vite . --template react-ts
pnpm install
```

### 游戏前端（Phase 1 成果）
```bash
cd apps/game
# 把 Phase 1 的 index.html + assets/ 复制过来
mkdir -p src
# 将 assets/ 目录移入 apps/game/
```

### 后端 (Go)
```bash
cd apps/server
mkdir -p cmd internal/{handler,service,repository,model,middleware,config} migrations

go mod init github.com/YOUR_USERNAME/virtual-campus-server
go get github.com/gin-gonic/gin
go get github.com/golang-jwt/jwt/v5
go get github.com/lib/pq
go get github.com/gorilla/websocket
```

### 后台管理 (React + Ant Design)
```bash
cd apps/admin
pnpm create vite . --template react-ts
pnpm add antd @ant-design/pro-components
pnpm install
```

### 共享类型包
```bash
cd packages/shared-types
pnpm init
# 编辑 package.json，name 改为 "@virtual-campus/shared-types"
```

创建 `packages/shared-types/index.ts`：
```typescript
export interface User {
  id: number; username: string; email: string;
  avatarUrl?: string; createdAt: string;
}

export interface Campus {
  id: number; name: string; slug: string;
  startMapId: number; startX: number; startY: number;
}

export interface NPC {
  id: string; name: string; mapId: string;
  x: number; y: number;
  interactionType: 'dialogue' | 'shop' | 'quest';
}

export interface Quest {
  id: number; title: string; description: string;
  objectives: { type: string; target: string; count: number; description: string }[];
  rewards: { type: string; amount: number }[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

---

## 1.5 添加 Turborepo

根目录创建 `turbo.json`：
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "dev": { "cache": false, "persistent": true },
    "lint": {},
    "test": {}
  }
}
```

根目录 `package.json`：
```json
{
  "name": "virtual-campus",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint"
  },
  "devDependencies": { "turbo": "^2.0.0" }
}
```

```bash
pnpm install
```

---

## 1.6 最终目录结构

```
virtual-campus/
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
├── apps/
│   ├── web/          ← React 平台前端
│   ├── game/         ← Phaser 3 游戏（Phase 1）
│   ├── server/       ← Go 后端 API
│   └── admin/        ← React 后台管理
├── packages/
│   ├── shared-types/ ← 共享 TypeScript 类型
│   └── ui/           ← 共享 UI 组件
├── deployment/
│   └── docker-compose.yml
└── docs/
```

---

## 1.7 验证方法

```bash
# 确认所有子项目存在
ls apps/web apps/game apps/server apps/admin packages/shared-types

# Go 项目能编译
cd apps/server && go build ./cmd/...

# 前端能启动
cd apps/web && pnpm dev
```

---

## 1.8 下一章

[第 2 章：PostgreSQL 数据库](02-PostgreSQL数据库.md)
