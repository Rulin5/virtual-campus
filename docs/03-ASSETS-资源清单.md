# 资源清单与素材管线

> 2026-08-06 核查：`assets/maps/exterior.png` 实际内容为 HTML 页面，
> 不是有效 PNG 图片。依赖该瓦片集的 `final_map.json` 当前无法直接渲染。
> `big-map.webp` 可作为临时完整地图底图，但不能替代原始瓦片集。

---

## 一、Phase 1 — 对标复刻资源

### 1.1 已下载资源

#### 图片 — 主要
| 文件 | 路径 | 用途 |
|------|------|------|
| peter-oravec.gif | assets/images/ | 预加载器动画（310×310） |
| peteroravec-logo.webp | assets/images/ | Play 界面 Logo（441×282） |
| peter-oravec.webp | assets/images/ | About Me 头像照片（450×450） |
| og-image.png | assets/images/ | Open Graph 社交分享图 |

#### 图片 — Logo
| 文件 | 用途 |
|------|------|
| dev-angular.webp | Technologies — Angular |
| dev-nodejs.webp | Technologies — Node.js |
| dev-expressjs.webp | Technologies — Express.js |
| dev-javascript.webp | Technologies — JavaScript |
| cv-gamo.webp | CV — GAMO a.s. |
| cv-scr.webp | CV — SCR |
| cv-kremsa.webp | CV — Kremsa Digital |
| cv-bethereum.webp | CV — Bethereum |
| cv-vub.webp | CV — VUB Bank |

#### 图片 — Memo 卡片
| 文件 | 用途 |
|------|------|
| card1_base.webp ~ card6_base.webp | 卡片底图（6 张） |
| card2_pattern.webp | 反光纹理蒙版 |
| card2_foil.webp | 箔纸纹理 |
| card3_pattern.webp | 闪光纹理蒙版 |

#### 图片 — UI
| 文件 | 用途 |
|------|------|
| pointer-hand.webp | 触摸/点击提示（浮动手指） |
| rotate-device.svg | 竖屏旋转设备提示图标 |

#### 图片 — Favicon
全套 19 个文件（16×16 到 310×310，含 Apple Touch Icon 和 MS Tile）

#### 地图数据
| 文件 | 大小 | 说明 |
|------|------|------|
| final_map.json | 1.6 MB | 主地图（140×140，24 层） |
| final_map_small.json | 5.3 MB | 完整地图数据 |
| walls-layer.json | 40 KB | 墙壁碰撞层 |
| footsteps-layer.json | 40 KB | 足迹效果层 |
| particle-trajectories.json | 140 KB | 粒子轨迹数据 |
| exterior.png | 3.4 KB | 主瓦片集（⚠️ 需验证完整性） |
| collisions-objects.png | 3.9 KB | 碰撞对象瓦片集 |
| big-map.webp | 54 KB | 全局地图缩略图（187×187） |

#### 其他
| 文件 | 说明 |
|------|------|
| styles-DVTBSD34.css | 原版 CSS 样式（81 KB） |
| phaser.min.js | Phaser 3 游戏引擎 |

### 1.2 ⚠️ 需补充的资源

| 缺失资源 | 说明 | 获取方式 |
|----------|------|---------|
| 玩家精灵表 | 角色上下左右行走动画 | 从原站 JS bundle 中提取路径 / 自行绘制 |
| NPC 精灵表 | 行人、汽车、鬼魂、舞者、怪物 | 同上 |
| 完整瓦片集（高分辨率） | 原地图引用 69344 个瓦片，下载的文件仅 3.4KB | 从原站分析实际加载路径 |
| 音效文件 | 脚步声、开门声等（如有） | 原站可能没有音效，省略 |

### 1.3 降级方案

| 缺失资源 | 降级方案 |
|----------|---------|
| 精灵表 | 用 CSS 绘制简单像素角色，或使用 Phaser 内置几何图形 + 颜色替代 |
| 完整瓦片集 | 使用地图 JSON 中的瓦片 ID 生成纯色块，保持地图布局不变 |
| 音效 | 省略，原站本身可能也没有音效 |

---

## 二、Phase 2 — 虚拟校园素材规范

### 2.1 素材统一标准

| 参数 | 标准 |
|------|------|
| 图块尺寸 | 32×32 或 48×48 像素 |
| 角色精灵 | 4 方向（上下左右），每方向 3-4 帧 |
| 建筑视角 | 俯视 45° 或正面像素风格 |
| 阴影方向 | 右下 45°，半透明黑色 |
| 色彩范围 | 限制调色板（16-32 色/素材） |
| 文件格式 | WebP（优先）/ PNG（降级） |
| 命名规范 | `{type}_{name}_{variant}.{ext}` |
| 透明背景 | 所有素材必须去背 |

### 2.2 AI 素材生产管线

```
┌─────────────────────────────────────────────────────┐
│                  AI 素材生产流程                       │
├─────────────────────────────────────────────────────┤
│                                                       │
│  需求描述 ──→ AI 图像生成 ──→ 背景去除 ──→ 批处理     │
│  (自然语言)    (MJ/DALL·E)    (rembg)      (Python)  │
│                                                  │    │
│  批处理内容：                                       │    │
│  ├── 统一缩放到目标尺寸                               │    │
│  ├── 调色板量化（限制颜色数）                         │    │
│  ├── 风格统一滤镜                                    │    │
│  └── 切割为 Sprite Sheet                            │    │
│                                                  │    │
│  人工审核 ──→ 通过 ──→ 导入 Tiled / 游戏             │
│                                                       │
└─────────────────────────────────────────────────────┘
```

#### 工具链

| 工具 | 用途 | 阶段 |
|------|------|------|
| Midjourney / DALL·E / Stable Diffusion | 生成原始像素风素材 | Phase 1 |
| rembg | AI 背景去除 | Phase 2 |
| Python + Pillow | 批量缩放、格式转换、调色板量化 | Phase 2 |
| Python + OpenCV | 识别道路/建筑轮廓（地图预处理） | Phase 2 |
| Aseprite | 精修像素画、制作动画帧 | Phase 2 |
| Tiled Map Editor | 组装地图、配置碰撞和传送点 | Phase 2 |
| Figma | UI 设计、图标 | Phase 2 |

#### 地图生成管线

```
学校平面图 / 百度地图截图
        │
        ▼
  OpenCV 识别道路和建筑轮廓 → GeoJSON
        │
        ▼
  AI 根据轮廓生成像素风素材
        │
        ▼
  人工统一尺寸、视角、色彩
        │
        ▼
  Tiled 组装图层 → 导出 JSON
        │
        ▼
  Phaser 加载
```

### 2.3 文件组织规范

```
assets/
├── tilesets/                    # 瓦片集（按风格分类）
│   ├── campus/
│   │   ├── ground.png           # 地面瓦片
│   │   ├── buildings.png        # 建筑瓦片
│   │   └── decorations.png      # 装饰物瓦片
│   └── indoor/
│       ├── classroom.png
│       └── library.png
│
├── sprites/                     # 角色精灵表
│   ├── player/
│   │   ├── male_default.png
│   │   └── female_default.png
│   └── npcs/
│       ├── teacher.png
│       ├── student.png
│       └── vendor.png
│
├── maps/                        # 地图 JSON（按校园）
│   └── {campus_slug}/
│       ├── main.json
│       ├── library.json
│       └── teaching_building.json
│
├── sounds/                      # 音效
│   ├── bgm/                     # 背景音乐
│   ├── sfx/                     # 音效
│   └── ambient/                 # 环境音
│
└── ui/                          # UI 元素
    ├── icons/
    ├── buttons/
    └── frames/
```
