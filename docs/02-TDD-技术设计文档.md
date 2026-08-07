# 技术设计文档（TDD）

## 虚拟校园平台

---

## 一、总体技术架构

### 1.1 架构全景图

```
┌──────────────────────────────────────────────────────────────────┐
│                        用户浏览器                                  │
│  ┌─────────────────────┐  ┌──────────────────────────────────┐  │
│  │   平台界面 (React)    │  │       游戏场景 (Phaser 3)        │  │
│  │   登录/注册/校园选择   │  │  角色移动 · 地图 · NPC · 碰撞    │  │
│  │   个人中心/排行榜      │  │  相机跟随 · 交互 · 特效         │  │
│  └────────┬────────────┘  └───────────────┬──────────────────┘  │
│           │                               │                       │
│  ┌────────┴───────────────────────────────┴──────────────────┐  │
│  │              通信层 (REST + WebSocket)                      │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                         Nginx (反向代理)                           │
└──────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐ ┌──────────────┐ ┌──────────────────┐
│  API 服务 (Go)   │ │ 静态资源服务  │ │  WebSocket 服务   │
│  Gin/Fiber      │ │  (Nginx/CDN) │ │  (Go + Gorilla)  │
└───────┬─────────┘ └──────────────┘ └──────────────────┘
        │
  ┌─────┴─────┐
  ▼           ▼
┌────────┐ ┌───────┐ ┌────────┐
│PostgreSQL│ │Redis  │ │ MinIO  │
└────────┘ └───────┘ └────────┘
```

### 1.2 技术选型总览

| 模块 | 技术 | 选型理由 |
|------|------|---------|
| 平台前端 | React + TypeScript + Vite | 生态丰富、TypeScript 类型安全、Vite 开发体验好 |
| 游戏引擎 | Phaser 3 | 成熟的 HTML5 2D 游戏框架，Tilemap/NPC/碰撞/动画开箱即用 |
| 状态管理 | Zustand | 轻量、无 boilerplate、支持 React 和 Vanilla JS |
| 地图编辑 | Tiled Map Editor | 开源瓦片地图编辑器，导出 JSON 格式 Phaser 可直接加载 |
| 后端 API | Go + Gin/Fiber | 高性能、低资源占用、适合容器化部署 |
| 数据库 | PostgreSQL | 成熟的关系型数据库，支持 JSON 字段、GIS 扩展 |
| 缓存 | Redis | 在线状态、排行榜、会话、限流 |
| 文件存储 | MinIO / S3 | 地图素材、头像、插件文件 |
| 实时通信 | WebSocket (Go + Gorilla) | 在线角色同步、聊天、实时活动 |
| 后台管理 | React + Ant Design Pro | 开箱即用的后台方案 |
| 像素素材 | Aseprite + AI 生成 | Aseprite 是像素画标准工具，AI 辅助批量生产 |
| 图片处理 | Python + Pillow + OpenCV | 批量切图、格式转换、地图预处理 |
| 部署 | Docker Compose + Nginx | Demo 阶段一键启动 |
| CI/CD | GitHub Actions | 自动构建、测试、部署 |
| 平台扩展 | WASM + Kubernetes | 插件沙箱、服务自动扩容 |

---

## 二、Phase 1 — 对标复刻（纯前端）

> 先完整复刻 peteroravec.com，掌握 Phaser 3 + 瓦片地图 + NPC + 模态交互的全部技术。

### 2.1 系统架构（纯前端版）

```
index.html
├── DOM Layer（HTML/CSS）
│   ├── Preloader + Play Screen
│   ├── Modal Windows × 10
│   └── Landscape Overlay
│
├── Canvas Layer（Phaser 3）
│   ├── GameScene（主场景）
│   ├── Player（玩家角色 + 输入控制）
│   ├── ChunkManager（地图分块加载）
│   ├── NPCManager（NPC 管理 + Web Worker 寻路）
│   └── InteractionZones（交互区域检测）
│
└── Service Layer（JS）
    ├── ModalManager（模态窗口管理）
    ├── EventBus（CustomEvent 事件总线）
    ├── StateManager（全局状态）
    └── i18n（多语言）
```

### 2.2 核心模块设计

#### 2.2.1 生命周期

```
DOMContentLoaded
  → Phase 1: 预加载（Loading → 进度条 GIF → 百分比）
  → Phase 2: Play 界面（Logo + Play 按钮）
  → Phase 3: 用户点击 Play → 初始化 Phaser.Game
  → Phase 4: 游戏循环运行（60fps）
  → Phase 5: 触发交互 → 打开模态 → 关闭模态 → 恢复游戏
```

#### 2.2.2 GameScene（游戏主场景）

```javascript
class GameScene extends Phaser.Scene {
  preload()  { /* 加载瓦片集、精灵表、地图 JSON */ }
  create()   { /* 创建地图 + 玩家 + NPC + 碰撞 + 相机 */ }
  update()   { /* 每帧：玩家移动 + NPC 更新 + 分块管理 + 交互检测 */ }
}
```

#### 2.2.3 Player（玩家）

```javascript
class Player {
  // 属性：sprite, speed(100px/s), direction('up'|'down'|'left'|'right')
  handleKeyboard()  { /* 方向键 + WASD → 8方向移动向量 */ }
  handleTouch()     { /* 虚拟摇杆拖动 / 点击目标路径移动 */ }
  update()          { /* 应用移动 + 碰撞检测 + 动画帧切换 */ }
}
```

#### 2.2.4 ChunkManager（分块管理）

```javascript
class ChunkManager {
  // chunkSize: 20×20 tiles
  // visibleRange: ±2 chunks
  loadChunk(col, row)   { /* 从 mapData 提取该块瓦片 → 创建 TilemapLayer */ }
  destroyChunk(col, row){ /* 销毁图层 → 释放内存 */ }
  update(playerX, playerY) { /* 计算可见范围 → 加载/卸载 */ }
}
```

#### 2.2.5 NPCManager + NPCEntity

```javascript
class NPCManager {
  // npcs: NPCEntity[]
  // pathfindingWorker: Worker('pathfinding-worker.js')
  addNPC(config)  { /* {type, x, y, path, speed} */ }
  update()        { /* 视锥裁剪 + 逐个 update */ }
}

class NPCEntity {
  // type: 'pedestrian'|'car'|'ghost'|'dancer'|'monster'|'crowd'
  update() { /* 沿路径移动 + 动画 + 汽车灯光控制 */ }
}
```

#### 2.2.6 ModalManager（模态管理）

```javascript
class ModalManager {
  open(modalId)  { /* 隐藏当前 → 显示目标 → backdrop → 暂停游戏 → CustomEvent */ }
  close()        { /* 隐藏当前 → 移除 backdrop → 恢复游戏 → CustomEvent */ }
}
```

#### 2.2.7 事件总线

```
game:ready       — 游戏初始化完成
zone:enter       — 玩家进入交互区域 {zoneId}
zone:exit        — 玩家离开交互区域
modal:open       — 打开模态 {modalId}
modal:close      — 关闭模态
map:request-open — 请求打开大地图
language:change  — 语言切换 {lang}
```

### 2.3 瓦片地图数据处理

#### 地图规格

```
尺寸：    140 × 140 瓦片
瓦片：    16 × 16 像素
图层：    24 层
总像素：  2240 × 2240
瓦片集：  exterior.png (176列 × ~394行 = 69344 tiles)
```

#### 图层分组

| 组名 | 图层 | 说明 |
|------|------|------|
| 地面层 | layer1-5 | 草地、道路、水面 |
| 建筑层 | layer6-10 | 建筑物和装饰 |
| 屋顶层 | roof_* | 进入建筑时隐藏（透明效果） |
| 桥梁层 | bridge* | 桥梁上/下半部分 |
| 汽车层 | cars | 停放车辆（装饰） |
| 墙壁层 | walls | **碰撞检测数据源** |
| 粒子层 | particles* | 环境特效 |
| 足迹层 | footsteps | 沙地/雪地足迹 |

### 2.4 CSS 关键设计

```
NES.css (CDN) → 基础复古 UI 组件
Press Start 2P (Google Fonts) → 像素字体
styles.css → 布局 / 模态 / 动画 / 响应式
```

关键类名：
- `.pixel-corners` — 像素风格窗口角装饰
- `.modal` — 模态容器（默认 `visibility: hidden`）
- `.modal-backdrop` — 半透明遮罩
- `.effect-card-holo` — 全息卡片光效
- `.vhs-rgb-layer` — CRT 色彩分离效果

### 2.5 移动端适配

```javascript
// VirtualJoystick：触摸拖动 → 方向向量
class VirtualJoystick {
  onTouchStart / onTouchMove / onTouchEnd
}
// 响应式：canvas CSS transform 缩放 + 模态 max-width/max-height + 字体 clamp()
// 横屏检测：orientation 变化 → 显示/隐藏 .landscape-overlay
```

### 2.6 项目文件结构（Phase 1）

```
peteroravec-replica/
├── index.html
├── assets/
│   ├── js/
│   │   ├── phaser.min.js
│   │   ├── game.js              # Phaser.Game + GameScene
│   │   ├── player.js            # 玩家类
│   │   ├── chunk-manager.js     # 分块管理器
│   │   ├── npc-manager.js       # NPC 管理器
│   │   ├── npc-entity.js        # NPC 实体
│   │   ├── modal-manager.js     # 模态窗口管理
│   │   ├── virtual-joystick.js  # 虚拟摇杆
│   │   ├── pathfinding-worker.js# Web Worker 寻路
│   │   ├── i18n.js              # 多语言
│   │   └── main.js              # 入口，初始化一切
│   ├── css/
│   │   └── styles.css
│   ├── images/                  # 图片资源
│   │   ├── favicon/
│   │   ├── logos/
│   │   ├── cards/
│   │   └── ui/
│   └── maps/                    # 地图数据
│       ├── final_map.json
│       ├── walls-layer.json
│       ├── footsteps-layer.json
│       ├── exterior.png
│       └── collisions-objects.png
└── docs/
```

---

## 三、Phase 2 — 平台化改造

### 3.1 Monorepo 结构

```
virtual-campus/
├── apps/
│   ├── web/                     # 平台前端 (React + TypeScript + Vite)
│   │   ├── src/
│   │   │   ├── pages/           # 登录、校园选择、个人中心、排行榜
│   │   │   ├── components/      # 通用 UI 组件
│   │   │   ├── hooks/           # 自定义 hooks
│   │   │   └── stores/          # Zustand stores
│   │   └── vite.config.ts
│   │
│   ├── game/                    # 游戏前端 (Phaser 3 + 平台集成)
│   │   ├── src/
│   │   │   ├── scenes/          # GameScene, BuildingScene
│   │   │   ├── entities/        # Player, NPC, Car
│   │   │   ├── systems/         # ChunkManager, QuestSystem, DialogueSystem
│   │   │   ├── workers/         # PathfindingWorker, AssetWorker
│   │   │   └── ui/              # ModalManager, Minimap, ChatBubble
│   │   └── assets/              # 当前校园的素材
│   │
│   ├── admin/                   # 后台管理 (React + Ant Design Pro)
│   │   ├── src/
│   │   │   ├── pages/           # 校园管理、地图编辑、NPC管理、任务管理
│   │   │   ├── components/      # MapEditor, DialogueTreeEditor
│   │   │   └── services/        # API 调用层
│   │   └── vite.config.ts
│   │
│   └── server/                  # 后端 API (Go)
│       ├── cmd/
│       │   └── main.go
│       ├── internal/
│       │   ├── handler/         # HTTP 处理器
│       │   ├── service/         # 业务逻辑
│       │   ├── repository/      # 数据访问
│       │   ├── model/           # 数据模型
│       │   ├── middleware/      # JWT、限流、日志
│       │   └── ws/              # WebSocket 处理
│       ├── migrations/          # 数据库迁移
│       └── go.mod
│
├── packages/
│   ├── game-engine/             # Phaser 封装（可复用游戏核心）
│   ├── shared-types/            # TypeScript 类型定义（前后端共享）
│   ├── map-schema/              # 地图 JSON Schema 验证
│   ├── plugin-sdk/              # 插件开发 SDK
│   └── ui/                      # 共享 UI 组件库
│
├── assets/                      # 公共素材（多校园共享）
│   ├── tilesets/                # 通用瓦片集
│   ├── sprites/                 # 角色精灵表
│   └── sounds/                  # 音效和背景音乐
│
├── docs/                        # 文档
├── examples/                    # 示例配置
├── deployment/                  # Docker Compose / K8s 配置
├── docker-compose.yml
├── turbo.json                   # Turborepo 配置
└── pnpm-workspace.yaml
```

### 3.2 数据库设计

#### 核心表

```sql
-- 组织和用户
organizations (id, name, slug, logo_url, created_at)
users (id, org_id, username, email, password_hash, avatar_url, created_at)

-- 校园和地图
campuses (id, org_id, name, start_map_id, start_x, start_y)
maps (id, campus_id, name, tilemap_json_url, width, height, tile_size)

-- 地图对象
map_objects (id, map_id, type, name, x, y, properties_json)

-- 虚拟角色
characters (id, user_id, campus_id, name, appearance_json, x, y, map_id)

-- NPC
npcs (id, map_id, name, sprite_key, x, y, path_json, dialogue_id, interaction_type)

-- 对话
dialogues (id, title)
dialogue_nodes (id, dialogue_id, npc_text, options_json, conditions_json, actions_json)

-- 任务
quests (id, campus_id, title, description, objectives_json, rewards_json, prerequisites_json)
user_quests (id, user_id, quest_id, status, progress_json, started_at, completed_at)

-- 道具
items (id, name, type, properties_json)
user_items (id, user_id, item_id, quantity)

-- 内容
news (id, campus_id, title, content, published_at)
events (id, campus_id, title, description, start_at, end_at, map_id, x, y)

-- 插件
plugins (id, org_id, name, version, entry_url, permissions_json, status)
```

#### Redis 缓存结构

| Key | 类型 | 用途 |
|-----|------|------|
| `online:users` | Set | 在线用户 ID |
| `online:user:{id}` | Hash | 用户位置、地图、状态 |
| `leaderboard:weekly` | Sorted Set | 周排行榜 |
| `map:{id}:cache` | String | 地图配置缓存 |
| `rate:{ip}:{endpoint}` | String | API 限流计数 |
| `session:{token}` | String | 用户会话 |

### 3.3 API 设计

#### REST API 清单

```
# 认证
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh

# 校园
GET    /api/campuses
GET    /api/campuses/{id}

# 地图
GET    /api/campuses/{campusId}/maps
GET    /api/maps/{mapId}
GET    /api/maps/{mapId}/objects

# 角色
GET    /api/characters/me
PUT    /api/characters/me          # 更新位置、外观
POST   /api/characters             # 创建角色

# NPC
GET    /api/maps/{mapId}/npcs
GET    /api/npcs/{npcId}
GET    /api/npcs/{npcId}/dialogue

# 任务
GET    /api/quests
GET    /api/quests/{questId}
POST   /api/quests/{questId}/accept
POST   /api/quests/{questId}/complete

# 道具
GET    /api/items
GET    /api/users/me/items

# 内容
GET    /api/news
GET    /api/events

# 后台管理（需 Admin 权限）
POST   /api/admin/campuses
PUT    /api/admin/campuses/{id}
POST   /api/admin/maps
POST   /api/admin/npcs
PUT    /api/admin/npcs/{id}
POST   /api/admin/quests
POST   /api/admin/news
POST   /api/admin/events

# WebSocket
WS     /ws                          # 实时通信
```

#### WebSocket 消息协议

```json
// 客户端 → 服务端
{"type": "player:move",     "data": {"x": 100, "y": 200, "mapId": "main"}}
{"type": "player:interact", "data": {"npcId": "library_teacher"}}
{"type": "chat:send",       "data": {"message": "Hello!", "scope": "map"}}

// 服务端 → 客户端
{"type": "players:update",  "data": [{"userId": 1, "x": 100, "y": 200}]}
{"type": "npc:state",       "data": {"npcId": "x", "state": "talking"}}
{"type": "chat:broadcast",  "data": {"userId": 1, "message": "Hello!"}}
{"type": "event:start",     "data": {"eventId": 1, "name": "迎新活动"}}
```

### 3.4 地图制作管线

```
学校平面图 / 百度地图截图
        │
        ▼
  手工标记建筑和道路轮廓
        │
        ▼
  Python + OpenCV 识别轮廓 → 生成 GeoJSON
        │
        ▼
  AI 生成像素风素材（建筑、道路、装饰物）
        │
        ▼
  人工统一尺寸、视角、光照、色彩
        │
        ▼
  导入 Tiled Map Editor
  ├── 地面层（草坪、道路、水面）
  ├── 建筑层（教学楼、图书馆、食堂）
  ├── 装饰层（树木、长椅、路灯）
  ├── 碰撞层（墙壁、障碍物）
  ├── NPC 对象层（NPC 出生点和路线）
  ├── 传送点层（地图间切换）
  └── 事件触发层（任务触发区域）
        │
        ▼
  导出 JSON → Phaser 加载
```

#### 素材规范

| 参数 | 标准 |
|------|------|
| 图块尺寸 | 32×32 或 48×48 像素 |
| 角色方向 | 上、下、左、右（4 方向） |
| 行走动画 | 每方向 3-4 帧 |
| 建筑视角 | 等距或俯视 45° |
| 阴影方向 | 右下 45° |
| 色彩范围 | 限制调色板（16-32 色） |
| 文件格式 | WebP（优先）/ PNG（降级） |
| 命名规范 | `{type}_{name}_{variant}.webp` |

### 3.5 AI 素材生产管线

```
需求描述（自然语言）
        │
        ▼
  AI 图像生成（Midjourney / DALL·E / Stable Diffusion）
        │
        ▼
  背景去除（rembg / Photoshop）
        │
        ▼
  Python + Pillow 批量处理
  ├── 统一缩放到目标尺寸
  ├── 调色板量化（限制颜色数）
  ├── 风格统一（像素化滤镜）
  └── 切割为 Sprite Sheet
        │
        ▼
  人工审核 → 通过 → 导入游戏
```

### 3.6 部署架构

#### Demo 阶段（Docker Compose）

```yaml
# docker-compose.yml
services:
  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    volumes: [./nginx.conf:/etc/nginx/nginx.conf]

  web:        # React 平台前端 (nginx 提供静态文件)
  game:       # Phaser 游戏前端 (nginx 提供静态文件)
  admin:      # 后台管理 (nginx 提供静态文件)

  api:
    build: ./apps/server
    depends_on: [postgres, redis]
    environment: [DATABASE_URL, REDIS_URL, JWT_SECRET]

  postgres:
    image: postgres:16-alpine
    volumes: [pgdata:/var/lib/postgresql/data]

  redis:
    image: redis:7-alpine

  minio:
    image: minio/minio

volumes: [pgdata]
```

#### 平台扩张阶段（Kubernetes）

```
Ingress (Nginx/Traefik)
  ├── /api/*     → API Service (Go, HPA 自动扩容)
  ├── /ws        → WebSocket Service (专用节点)
  ├── /admin/*   → Admin SPA (CDN)
  ├── /assets/*  → MinIO / CDN
  └── /*         → Game SPA (CDN)

中间件：PostgreSQL (主从) + Redis Cluster + MinIO Cluster
监控：Prometheus + Grafana + Loki (日志)
```

### 3.7 测试策略

| 层级 | 工具 | 覆盖目标 |
|------|------|---------|
| 前端单元测试 | Vitest | 工具函数、状态管理、hooks |
| 游戏流程测试 | Playwright | 角色移动、NPC 交互、模态打开 |
| 后端单元测试 | Go Test | Service 层、Repository 层 |
| API 测试 | Postman / hurl | 全接口覆盖 |
| E2E 测试 | Playwright | 注册 → 登录 → 进校园 → 对话 → 完成任务 |
| 代码规范 | ESLint + Prettier | 全项目 |
| 提交前检查 | Husky + lint-staged | 每次 commit |

---

## 四、关键技术决策记录

| 决策 | 选择 | 理由 |
|------|------|------|
| 前端框架 | React（平台）+ Phaser 3（游戏） | React 生态好，Phaser 3 是 2D 像素游戏最佳选择 |
| 后端语言 | Go | 性能好、部署简单、适合容器化 |
| 数据库 | PostgreSQL | 成熟稳定、支持 JSON/GIS、适合多租户 |
| 地图编辑 | Tiled | 开源标准工具，直接导出 Phaser 兼容 JSON |
| 包管理 | pnpm + Turborepo | 高效的 Monorepo 工具链 |
| 部署 | Docker Compose → K8s | 渐进式复杂度 |
| 素材格式 | WebP | 体积小、支持透明通道、浏览器兼容性好 |
