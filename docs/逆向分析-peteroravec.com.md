# peteroravec.com 逆向分析报告

> 通过对原站 HTML 源码、CSS 样式、地图 JSON 数据、以及 Angualr 编译后 JS bundle 的深度分析，还原出完整的技术架构和游戏系统。

---

## 一、技术架构

### 1.1 总体架构

```
Angular 19（外壳）
  ├── DOM 层：模态窗口、预加载器、Play 界面、横屏提示
  ├── Phaser 3 游戏引擎（WebGL 渲染）
  │     ├── GameScene（主场景，动态 import 加载）
  │     ├── 玩家系统
  │     ├── NPC 系统（行人/汽车/鬼魂/舞者/怪物/人群）
  │     ├── 分块地图系统（ChunkManager）
  │     ├── Web Worker 寻路（EasyStar.js）
  │     ├── Web Worker 烟雾特效
  │     └── 光照/粒子/水面特效
  └── Angular Service 层
        ├── ChunkManagerService（分块管理服务）
        ├── GeneralService（设备检测等通用服务）
        └── 全局回调函数（Angular ↔ Phaser 通信）
```

### 1.2 关键发现：GameScene 是动态加载的

```javascript
// 从 main-RV3Z53H4.js 提取
const [_, {GameScene: gameSceneClass}] = await Promise.all([
  import("./chunk-VANY4YOC.js"),    // 11KB - 轻量 wrapper
  import("./chunk-WMFY56ZM.js")     // 571KB - 真正的主游戏代码
]);
this.gameScene = new gameSceneClass(nativeScale, progressCallback, ...);
```

**这意味着**：Phaser 游戏代码不是打包在主 bundle 里的，而是用户点击后才动态加载（lazy loading），减少首屏加载时间。

---

## 二、Phaser 游戏配置

### 2.1 核心参数（从编译 JS 中还原）

```javascript
const gameConfig = {
  type: Phaser.AUTO,                // WebGL 优先，自动降级 Canvas 2D
  width: computedWidth,              // 根据设备动态计算
  height: computedHeight,            // 根据设备动态计算
  pixelArt: true,                    // 像素渲染
  antialias: false,                  // 关闭抗锯齿
  backgroundColor: "#ffffff",        // 白色背景

  parent: gameContainerElement,      // Angular 组件的 DOM 引用

  scale: {
    mode: Phaser.Scale.NONE,         // 不自动缩放！手动控制
    autoCenter: Phaser.Scale.NO_CENTER
  },

  render: {
    powerPreference: "high-performance",
    failIfMajorPerformanceCaveat: false,
    batchSize: 4096,
    antialias: false,
    antialiasGL: false,
    pixelArt: true,
    roundPixels: true,              // 像素对齐
    autoMobilePipeline: true,       // 移动端自动优化
    desynchronized: false,
    mipmapFilter: "NEAREST"         // 像素风格纹理过滤
  },

  physics: {
    default: "arcade",
    arcade: {
      fixedStep: false              // 不固定物理步长
    }
  }
};
```

### 2.2 缩放系统（Scale System）

原站没有使用 Phaser 内置的缩放模式，而是**手动计算画布尺寸**：

```javascript
// 设备像素比 → 缩放因子
devicePixelRatio < 2   → scaleFactor = 4   → nativeScale = 0.25
devicePixelRatio < 3   → scaleFactor = 6   → nativeScale = 0.166
devicePixelRatio < 4   → scaleFactor = 8   → nativeScale = 0.125
default                → scaleFactor = 2   → nativeScale = 0.5

// 计算渲染分辨率
renderWidth  = Math.floor(visualViewport.width / scaleFactor)
renderHeight = Math.floor(visualViewport.height / scaleFactor)

// CSS 拉伸
canvas.style.width  = visualViewport.width + "px"
canvas.style.height = visualViewport.height + "px"
```

**为什么这样设计**：
- 高 DPI 屏幕 → 渲染分辨率更低 → 减少 GPU 负担
- CSS 拉伸到全屏 → `image-rendering: pixelated` 保持像素清晰
- 视觉上看起来仍然是像素风格

---

## 三、游戏系统完整清单

### 3.1 核心系统（从 chunk-WMFY56ZM.js 提取）

| 系统 | 初始化代码 | 说明 |
|------|-----------|------|
| **ChunkManager** | `this.chunkManager` | 地图分块加载管理器 |
| **CrowdManager** | `this.crowdManager = new st()` | 人群管理器，控制成组 NPC 的出现/消失 |
| **PathfindingWorker** | `this.pathfindingWorker = new tt()` | Web Worker 寻路 |
| **SmokeWorker** | `this.smokeWorker = new it()` | Web Worker 烟雾粒子特效 |
| **EasyStar** | `this.easystar = new ts()` | A* 寻路算法库 |
| **Monster** | `this.monster = new et()` | 怪物系统（可抓玩家） |
| **LightingManager** | `this.lightingManager = new at()` | 光照管理系统 |
| **NPCGhost** | `this.npcGhost = new nt()` | 鬼魂 NPC |
| **DancingNPCs** | `this.dancingNPCs = new ot()` | 舞者 NPC 群 |
| **FountainSprayManager** | `this.fountainSprayManager = new yt()` | 喷泉水雾粒子 |
| **FactoryAnimations** | `this.factoryAnimations = new Je()` | 工厂动画 |
| **RatAttack** | `this.ratAttack = new lt()` | 老鼠袭击事件 |
| **FogManager** | `this.fogManager = new rt()` | 雾效系统 |
| **Ropes** | `this.ropes = new Qe()` | 绳索物理效果 |
| **TornadoEmitter** | `this.tornadoEmitter = new ft()` | 龙卷风粒子发射器 |

### 3.2 完整 Update 循环（共 75+ 个 update 方法）

```
每帧执行（60fps）：

玩家相关：
  updateMovement()              — 玩家移动
  updateAnimationForDirection() — 玩家动画
  updateGrabState()             — 怪物抓取状态
  updateHolding()               — 玩家持物
  updateHoldingTentacles()      — 持物触手
  updateReleasing()             — 释放物品
  updateEating()                — 进食动画
  updateEyes()                  — 眼睛跟踪
  updateLookAtPlayer()          — NPC 看向玩家

NPC 系统：
  updateConcertNPCs()           — 音乐会 NPC
  updateCrowdStaticNPCs()       — 静态人群
  updateProtestersRisingNPCs()  — 抗议者 NPC
  updateGhost()                 — 鬼魂移动
  updateGhostFlashlightVisibility() — 鬼魂手电筒
  updateCarPosition()           — 汽车移动
  updateCarBodyForDirection()   — 车身朝向
  updateWheelPositions()        — 车轮位置（4 个独立轮子）
  updateWheelsForDirection()    — 车轮转向
  updateCarTentacle()           — 汽车触手
  updateCarRouteSquare()        — 汽车路线方块
  updatePoliceCarLights()       — 警车灯光
  updateTrainCollision()        — 火车碰撞
  updatePathfinderMovement()    — 寻路移动
  updatePaths()                 — 路径更新
  updateDirections()            — 朝向更新
  updateFormationPositions()    — 编队位置
  updateWanderSprite()          — 漫游精灵
  updateBubblePosition()        — 对话气泡位置
  updateIdleSpeech()            — 闲谈对话
  updateIdleBubblePosition()    — 闲谈气泡
  updateSingleProtesterBubble() — 抗议者气泡
  updateAngryMessageState()     — 愤怒消息状态
  updateMonsterVisibility()     — 怪物可见性
  updateFleeing()               — 逃跑行为
  updateGrabbing()              — 抓取行为

特效系统：
  updateWaterDistortion()       — 水面扭曲
  updateCoastWaterMask()        — 海岸水遮罩
  updateAreaParticleEmitters()  — 区域粒子
  updateSmokeParticlesAlongPath() — 沿路径烟雾
  updateSmokePaths()            — 烟雾路径
  updateTorchLights()           — 火把光照
  updateFlashlight()            — 手电筒
  updateDarknessOverlay()       — 黑暗遮罩
  updateLaserTransform()        — 激光变换
  updateChoreography()          — 编排动画（灯光秀）
  updateMultiBladeRotor()       — 多叶旋翼
  updateRotorPerspective()      — 旋翼透视
  updateRotorPositions()        — 旋翼位置
  updateRotorsRandomPosition()  — 旋翼随机位置
  updateWindTurbineRotation()   — 风力涡轮
  updateTargetingLine()         — 瞄准线
  updateTargetingLineParticles()— 瞄准线粒子
  updateTornadoGrab()           — 龙卷风抓取
  updateToyTentacle()           — 玩具触手
  updateBladeBaseHeight()       — 叶片底座高度

UI/调试：
  updateDebugGraphics()         — 调试图形
  updateDebugText()             — 调试文字
  updateNPCDebugText()          — NPC 调试文字
  updateParticleRegionsDebug()  — 粒子区域调试
  updateCachedCanvasRect()      — Canvas 矩形缓存
  updateJoystickStick()         — 摇杆位置
  updateNativeScale()           — 缩放因子更新
  updateDepth()/updateDepths()  — 深度排序
  updateSpatialGrid()           — 空间网格
  updateViewport()              — 视口更新
  updateRoofAreas()             — 屋顶区域
  updateTime()                  — 时间系统
  updateDJSprite()              — DJ 精灵
  updateItem()                  — 道具更新
  updateWithPlayer()            — 与玩家联动
```

---

## 四、地图数据规格

### 4.1 主地图（final_map.json）

```
尺寸：    140 × 140 瓦片
瓦片：    16 × 16 像素
总像素：  2240 × 2240
图层：    24 层
瓦片集 1：exterior.png（176 列 × 394 行 = 69344 瓦片，2816×6304 px）
瓦片集 2：collisions-objects.png（10 列 × 1 行 = 10 瓦片，160×16 px）
瓦片集 3：tileset-particles.tsx（外部 TSX 文件）
```

### 4.2 分块配置（master.json）

```json
{
  "chunkWidth": 28,
  "chunkHeight": 28,
  "nbChunksHorizontal": 5,
  "nbChunksVertical": 5,
  "originalWidth": 140,
  "originalHeight": 140
}
```

地图被切割为 5×5 = 25 个 chunk，每个 28×28 瓦片。

---

## 五、内容标记系统

### 5.1 标记类型

| 标记类型 | CSS 类名 | 含义 |
|---------|---------|------|
| **sunburn** | `.icon-sunburn` | 信息点（Technologies、About、CV 等） |
| **vortex** | `.icon-vortex` | Memo 收集卡片 |
| **visited** | `.icon-visited` | 已访问过的标记 |

### 5.2 访问统计

原站跟踪了每种标记的访问百分比：
- `visitedPercentage` — 信息点访问比例
- `vortexVisitedPercentage` — Memo 访问比例
- `sunburnVisitedPercentage` — 阳光标记访问比例

---

## 六、NPC 系统详情

### 6.1 NPC 类型（从代码中提取）

| 类型 | 代码关键词 | 行为 |
|------|----------|------|
| 行人 | Pedestrian/Wander | 沿预设路径行走 |
| 汽车 | Car | 4 个独立轮子、刹车灯、转向灯、警车灯光 |
| 鬼魂 | Ghost/NPCGhost | 漂浮移动，有手电筒效果 |
| 舞者 | DancingNPCs | 音乐会/迪厅区域跳舞 |
| 怪物 | Monster | 可抓住玩家（`_isGrabbedByMonster`） |
| 抗议者 | ProtestersRising | 举牌抗议，有对话气泡 |
| 音乐会人群 | ConcertNPCs | 音乐会区域的观众 |
| 静态人群 | CrowdStatic | 背景人群装饰 |
| 老鼠 | RatAttack | 老鼠袭击事件 |
| DJ | DJSprite | DJ 台动画 |

### 6.2 汽车系统（特别详细）

原站的汽车 NPC 有一个完整的视觉系统：

```
车身旋转    → carRotation, carTargetRotation
车身朝向    → updateCarBodyForDirection()
4 个独立轮子 → updateWheelPositions(), updateWheelsForDirection()
转向灯      → blinkState, blinkTimer
刹车灯      → brakeLightConfig, brakeLightSprite, brakeLightCurrentKey
路线系统    → carRouteSquares, carRouteLines, carRoutesInitialized
交通管理    → carTrafficInitialized, carTrafficScheduled
碰撞检测    → carCollisionWidth, carCollisionHeight
            → carPlayerCollisionCounter, carNpcCollisionCheckCounter
触手        → carTentacleIndex, updateCarTentacle()
警车        → updatePoliceCarLights()
```

### 6.3 寻路系统

```
EasyStar.js (A* 算法) → Web Worker 中运行
  ├── this.easystar = new ts()      — A* 实例
  ├── this.pathfindingWorker        — Worker 线程
  ├── updatePathfinderMovement()    — 按寻路结果移动
  ├── updatePaths()                 — 路径管理
  └── cancelPath()                  — 取消寻路
```

---

## 七、特效系统详情

### 7.1 水面系统
- `updateWaterDistortion()` — 水面扭曲着色器
- `updateCoastWaterMask()` — 海岸线水遮罩
- `_isOnBeachTile` — 检测玩家是否在沙滩上
- `_lastWaterCamX/Y/W/H` — 水面相机缓存

### 7.2 光照系统
- `LightingManager` — 全局光照管理
- `updateTorchLights()` — 火把光源
- `updateFlashlight()` — 手电筒光源
- `updateDarknessOverlay()` — 黑暗区域遮罩
- `updateGhostFlashlightVisibility()` — 鬼魂手电筒

### 7.3 粒子系统
- `SmokeWorker` — 独立的 Web Worker 计算烟雾粒子
- `updateSmokeParticlesAlongPath()` — 沿路径烟雾
- `updateSmokePaths()` — 烟雾路径管理
- `updateAreaParticleEmitters()` — 区域粒子发射器
- `TornadoEmitter` — 龙卷风粒子

### 7.4 其他特效
- `Ropes` — 绳索物理
- `updateMultiBladeRotor()` — 多叶旋翼
- `updateWindTurbineRotation()` — 风力涡轮
- `FountainSprayManager` — 喷泉
- `FactoryAnimations` — 工厂动画
- `FogManager` — 雾效
- `Laser` — 激光系统（有编排动画 Choreography）

---

## 八、Angular ↔ Phaser 通信桥梁

### 8.1 全局回调

原站使用全局函数实现 Angular 组件和 Phaser 场景之间的通信：

```javascript
// Angular → Phaser
window.openModal         = (type) => gameScene.handleMenuClick(type)
window.closeModal        = ()     => gameScene.closeMarker(...)
window.navigateMemo      = (id, direction) => ...

// Phaser → Angular
window.hideModalWithBackdrop = () => component.hideModal(...)
window.showModalWithBackdrop = () => component.showModal(...)
window.ModalWithBackdrop     = () => component.Modal(...)
```

### 8.2 Service 层

- `ChunkManagerService` — Angular 服务，管理分块缩放因子
- `GeneralService` — 设备类型检测（决定 scaleFactor）
- `gameScene.setJoystickVisible()` — 控制虚拟摇杆显隐
- `gameScene.hideAllSpeechBubbles()` — 模态打开时隐藏所有对话气泡
- `gameScene.hideAllContentMarkers()` — 模态打开时隐藏所有内容标记

---

## 九、已下载资源清单（共 71 个文件）

### 图片 — 53 个
- Logo（9 个）：dev-angular/webp, dev-nodejs, dev-expressjs, dev-javascript, cv-gamo, cv-scr, cv-kremsa, cv-bethereum, cv-vub
- Memo 卡片（9 个）：card1-6_base, card2_pattern, card2_foil, card3_pattern
- 作品集截图（3 个）：peteroravec-v1, portfolio-angularsk, portfolio-eutxo
- UI（6 个）：pointer-hand, rotate-device, cable-handler2, map-holder-mini3, monitor
- Under the Hood（4 个）：debug1, debug2, tiled1, tiled2
- 预加载/头像（4 个）：peter-oravec.gif, peter-oravec.webp, peteroravec-logo.webp, og-image.png
- Favicon（18 个）

### 地图 — 10 个
- final_map.json（1.6 MB）
- final_map_small.json（5.3 MB）
- walls-layer.json, footsteps-layer.json, particle-trajectories.json
- big-map.webp, mini-map.webp
- exterior.png（⚠️无效）, collisions-objects.png
- chunks/master.json

### JavaScript — 7 个
- phaser.min.js（885 KB）
- chunk-WMFY56ZM.js（571 KB）← 主游戏代码
- main-RV3Z53H4.js（206 KB）← Angular 壳
- chunk-RA2FASQA.js（156 KB）← Angular 框架
- chunk-VANY4YOC.js（11 KB）
- chunk-JI7HG47Y.js, polyfills-A7F7OIKC.js

### CSS — 1 个
- styles-DVTBSD34.css（81 KB）

---

## 十、逆向结论：复刻所需做的

基于以上分析，要 1:1 复刻 peteroravec.com，需要实现：

### Phase 1 必须实现
1. ✅ Phaser Game 初始化（WebGL + 手动缩放）
2. ✅ 瓦片地图加载（140×140, 24 层, 分块 5×5）
3. ✅ 玩家移动（方向键 + 触摸摇杆）
4. ✅ 分块加载（ChunkManager, EasyStar 寻路）
5. ✅ 模态窗口（Angular → 原生 DOM 操作替代）
6. ✅ NPC 系统（行人、汽车含完整轮子/灯光）
7. ✅ 交互区域 + 内容标记
8. ✅ 移动端适配（虚拟摇杆 + 缩放 + 横屏）

### Phase 2 可选实现
9. 特效系统（水面扭曲、光照、粒子、烟雾）
10. 怪物系统（抓取、逃跑）
11. 音乐会/抗议者/老鼠等事件 NPC
12. 龙卷风/喷泉/雾等环境特效
13. 激光编排灯光秀
