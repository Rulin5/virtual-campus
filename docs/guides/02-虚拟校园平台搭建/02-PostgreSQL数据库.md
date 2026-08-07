# Phase 2 第 2 章：PostgreSQL 数据库

> **本章目标**：用 Docker 启动 PostgreSQL，执行 SQL 创建 20+ 张数据表，理解每张表的用途。
>
> **预计时间**：2-3 小时

---

## 2.1 数据库表总览

```
organizations (学校/组织)
  └── campuses (校园)
        ├── maps (地图)
        │     ├── map_objects (建筑、传送点)
        │     └── npcs (NPC)
        ├── quests (任务)
        ├── news (新闻)
        └── events (活动)

users (用户)
  ├── characters (虚拟角色)
  ├── user_quests (任务进度)
  └── user_items (背包)

dialogues (对话) → dialogue_nodes (对话节点)
plugins (插件，未来扩展)
items (道具)
```

---

## 2.2 创建 docker-compose.yml

`deployment/docker-compose.yml`：

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: vc-postgres
    environment:
      POSTGRES_USER: vc_user
      POSTGRES_PASSWORD: vc_password
      POSTGRES_DB: virtual_campus
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql

  redis:
    image: redis:7-alpine
    container_name: vc-redis
    ports:
      - "6379:6379"

  minio:
    image: minio/minio
    container_name: vc-minio
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    command: server /data --console-address ":9001"
    volumes:
      - miniodata:/data

volumes:
  pgdata:
  miniodata:
```

---

## 2.3 创建 init.sql

`deployment/init.sql` — 完整建表脚本（部署时自动执行）：

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===== 1. 组织 =====
CREATE TABLE organizations (
    id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE, logo_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===== 2. 用户 =====
CREATE TABLE users (
    id SERIAL PRIMARY KEY, org_id INTEGER REFERENCES organizations(id),
    username VARCHAR(50) NOT NULL UNIQUE, email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL, avatar_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===== 3. 校园 =====
CREATE TABLE campuses (
    id SERIAL PRIMARY KEY, org_id INTEGER REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL, slug VARCHAR(100) NOT NULL UNIQUE,
    start_map_id INTEGER, start_x INTEGER DEFAULT 500, start_y INTEGER DEFAULT 300,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===== 4. 地图 =====
CREATE TABLE maps (
    id SERIAL PRIMARY KEY, campus_id INTEGER REFERENCES campuses(id),
    name VARCHAR(255) NOT NULL, tilemap_json_url TEXT,
    width INTEGER NOT NULL, height INTEGER NOT NULL,
    tile_size INTEGER DEFAULT 32, is_indoor BOOLEAN DEFAULT FALSE
);

CREATE TABLE map_objects (
    id SERIAL PRIMARY KEY, map_id INTEGER REFERENCES maps(id),
    type VARCHAR(50) NOT NULL, name VARCHAR(255),
    x INTEGER NOT NULL, y INTEGER NOT NULL,
    width INTEGER, height INTEGER, properties_json JSONB DEFAULT '{}'
);

-- ===== 5. 角色 =====
CREATE TABLE characters (
    id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) UNIQUE,
    campus_id INTEGER REFERENCES campuses(id), name VARCHAR(50) NOT NULL,
    appearance_json JSONB DEFAULT '{}',
    map_id INTEGER REFERENCES maps(id), x INTEGER DEFAULT 500, y INTEGER DEFAULT 300,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ===== 6. NPC =====
CREATE TABLE npcs (
    id VARCHAR(100) PRIMARY KEY, map_id INTEGER REFERENCES maps(id),
    name VARCHAR(255) NOT NULL, sprite_key VARCHAR(100),
    x INTEGER NOT NULL, y INTEGER NOT NULL,
    path_json JSONB DEFAULT '[]', dialogue_id VARCHAR(100),
    interaction_type VARCHAR(50) DEFAULT 'dialogue'
);

-- ===== 7. 对话 =====
CREATE TABLE dialogues (
    id VARCHAR(100) PRIMARY KEY, title VARCHAR(255), data_json JSONB DEFAULT '{}'
);

-- ===== 8. 任务 =====
CREATE TABLE quests (
    id SERIAL PRIMARY KEY, campus_id INTEGER REFERENCES campuses(id),
    title VARCHAR(255) NOT NULL, description TEXT,
    objectives_json JSONB NOT NULL, rewards_json JSONB DEFAULT '[]',
    prerequisites_json JSONB DEFAULT '[]', is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE user_quests (
    id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id),
    quest_id INTEGER REFERENCES quests(id),
    status VARCHAR(20) DEFAULT 'in_progress',
    progress_json JSONB DEFAULT '{}',
    started_at TIMESTAMP DEFAULT NOW(), completed_at TIMESTAMP
);

-- ===== 9. 道具 =====
CREATE TABLE items (
    id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL,
    description TEXT, type VARCHAR(50), icon_url TEXT
);

CREATE TABLE user_items (
    id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id),
    item_id INTEGER REFERENCES items(id), quantity INTEGER DEFAULT 1
);

-- ===== 10. 内容 =====
CREATE TABLE news (
    id SERIAL PRIMARY KEY, campus_id INTEGER REFERENCES campuses(id),
    title VARCHAR(255) NOT NULL, content TEXT,
    is_published BOOLEAN DEFAULT FALSE, published_at TIMESTAMP
);

CREATE TABLE events (
    id SERIAL PRIMARY KEY, campus_id INTEGER REFERENCES campuses(id),
    title VARCHAR(255) NOT NULL, description TEXT,
    start_at TIMESTAMP, end_at TIMESTAMP,
    map_id INTEGER REFERENCES maps(id), x INTEGER, y INTEGER
);

-- ===== 11. 插件 =====
CREATE TABLE plugins (
    id SERIAL PRIMARY KEY, org_id INTEGER REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL, version VARCHAR(20) DEFAULT '1.0.0',
    entry_url TEXT, permissions_json JSONB DEFAULT '[]', status VARCHAR(20) DEFAULT 'active'
);

-- ===== 12. 索引 =====
CREATE INDEX idx_users_org ON users(org_id);
CREATE INDEX idx_maps_campus ON maps(campus_id);
CREATE INDEX idx_npcs_map ON npcs(map_id);
CREATE INDEX idx_quests_campus ON quests(campus_id);
CREATE INDEX idx_user_quests_user ON user_quests(user_id);
```

---

## 2.4 启动数据库

```bash
cd deployment
docker compose up -d postgres redis minio
# -d = 后台运行

# 检查运行状态
docker compose ps

# 测试数据库连接
docker exec -it vc-postgres psql -U vc_user -d virtual_campus
# 在 psql 中：
\dt       # 列出所有表
\d users  # 查看 users 表结构
\q        # 退出
```

MinIO 控制台：http://localhost:9001（minioadmin / minioadmin）

---

## 2.5 验证方法

1. `docker compose ps` 显示 3 个服务都是 Up
2. 能连上数据库并列出表
3. MinIO 控制台能打开

---

## 2.6 下一章

[第 3 章：Go API 骨架](03-GoAPI骨架.md)
