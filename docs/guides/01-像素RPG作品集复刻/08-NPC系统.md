# 第8章 · NPC 系统 (NPC System)

> **Phase 1** — 核心基础搭建 | **预计时间：** 50-70 分钟

---

## 本章目标

- 创建 `NPCManager` 类，管理所有 NPC 的生成与更新
- 创建 `PedestrianNPC` 类，让像素小人沿路径巡逻
- 创建 `CarNPC` 类，让彩色小汽车在路上往返
- 实现视口裁剪（viewport culling），屏幕外的 NPC 自动隐藏
- 使用纯色矩形作为占位精灵（无需真实 spritesheet）

---

## 需要创建/修改的文件

| 操作 | 文件 | 说明 |
|------|------|------|
| **新建** | `assets/js/npc.js` | NPC 管理器、行人类、汽车类 |
| 修改 | `assets/js/game.js` | 在 `create()` 中初始化 NPCManager，在 `update()` 中调用更新 |

---

## 1. 核心代码：`assets/js/npc.js`

> **设计说明：** 由于 Phase 1 还没有真实的 spritesheet，我们用 Phaser 的 `Graphics` 对象绘制彩色矩形作为 NPC 的占位外观。行人是一组小矩形组成的"像素人"形状，汽车是矩形加两个黑点（轮子）。

```javascript
/**
 * npc.js — NPC 系统
 * 
 * 包含三个类：
 * - NPCManager      : 管理所有 NPC 的生命周期和视口裁剪
 * - PedestrianNPC   : 沿路径巡逻的像素小人
 * - CarNPC          : 沿路径往返的彩色汽车
 */

// =========================================================================
//  NPCManager — 总管所有 NPC
// =========================================================================

class NPCManager {

  /**
   * @param {Phaser.Scene} scene — 游戏场景
   */
  constructor(scene) {
    this.scene = scene;
    this.npcs = [];            // 所有 NPC 实例
    this.camera = scene.cameras.main;

    console.log('[NPCManager] Created');
  }

  /**
   * 添加一个 NPC 到管理列表
   * @param {PedestrianNPC|CarNPC} npc
   */
  add(npc) {
    this.npcs.push(npc);
    console.log('[NPCManager] Added NPC. Total:', this.npcs.length);
  }

  /**
   * 每帧调用：更新所有 NPC 的逻辑
   * 包含视口裁剪 — 屏幕外的 NPC 设为不可见
   */
  update() {
    const cam = this.camera;
    // 视口边界，稍微扩大一些避免边缘闪烁
    const bounds = {
      left:   cam.scrollX - 50,
      right:  cam.scrollX + cam.width + 50,
      top:    cam.scrollY - 50,
      bottom: cam.scrollY + cam.height + 50,
    };

    for (const npc of this.npcs) {
      npc.update();

      // ===== 视口裁剪 (Viewport Culling) =====
      // 如果 NPC 在屏幕外，隐藏它以节省性能
      const npcX = npc.sprite ? npc.sprite.x : npc.graphics.x;
      const npcY = npc.sprite ? npc.sprite.y : npc.graphics.y;

      const isInView = (
        npcX > bounds.left &&
        npcX < bounds.right &&
        npcY > bounds.top &&
        npcY < bounds.bottom
      );

      // 所有可见元素一起切换
      if (npc.graphics) npc.graphics.setVisible(isInView);
      if (npc.sprite)    npc.sprite.setVisible(isInView);
      if (npc.wheel1)    npc.wheel1.setVisible(isInView);
      if (npc.wheel2)    npc.wheel2.setVisible(isInView);
    }

    // 调试：每60帧输出一次可见 NPC 数量
    if (this.scene.game.loop.frame % 60 === 0) {
      const visibleCount = this.npcs.filter(n => {
        return n.graphics ? n.graphics.visible : true;
      }).length;
      // console.log('[NPCManager] Visible NPCs:', visibleCount, '/', this.npcs.length);
    }
  }
}


// =========================================================================
//  PedestrianNPC — 像素小人，沿路径巡逻
// =========================================================================

class PedestrianNPC {

  /**
   * @param {Phaser.Scene} scene
   * @param {Array<{x:number, y:number}>} waypoints — 路径点数组
   * @param {object} options — 可选配置
   * @param {number} options.speed — 每段路径的移动时间（毫秒），默认 2000
   * @param {number} options.bodyColor — 身体颜色 (hex)，默认 0x4a90d9
   * @param {number} options.headColor — 头部颜色 (hex)，默认 0xffccaa
   * @param {boolean} options.faceRight — 初始朝向，默认 true
   */
  constructor(scene, waypoints, options = {}) {
    this.scene = scene;
    this.waypoints = waypoints;
    this.currentWaypointIdx = 1;       // 起点在 waypoints[0]，目标在 waypoints[1]
    this.direction = 1;                 // 1 = 向前，-1 = 向后（巡逻模式）
    this.speed = options.speed || 2000;
    this.bodyColor = options.bodyColor || 0x4a90d9;
    this.headColor = options.headColor || 0xffccaa;

    // ===== 用 Graphics 绘制像素小人 =====
    this.graphics = scene.add.graphics();
    this._drawCharacter();
    this.graphics.setDepth(10);  // 确保渲染在玩家之上或合适的层级
    this.graphics.setPosition(waypoints[0].x, waypoints[0].y);

    // ===== 启动巡逻 Tween =====
    this._moveToNextWaypoint();
  }

  /**
   * 绘制一个简单的像素小人（彩色矩形拼成）
   * 形状：头部 + 身体 + 两条腿
   */
  _drawCharacter() {
    const g = this.graphics;
    g.clear();

    // 头部 (8x8 像素方框，下面一个小矩形)
    g.fillStyle(this.headColor, 1);
    g.fillRect(-4, -14, 8, 8);    // 头部主体

    // 身体 (8x10)
    g.fillStyle(this.bodyColor, 1);
    g.fillRect(-4, -6, 8, 10);    // 身体

    // 腿 (两条 3x6 的矩形)
    g.fillStyle(0x333333, 1);
    g.fillRect(-4, 4, 3, 6);      // 左腿
    g.fillRect(1, 4, 3, 6);       // 右腿

    // 眼睛 (两个小白点)
    g.fillStyle(0xffffff, 1);
    g.fillRect(-2, -12, 2, 2);    // 左眼
    g.fillRect(2, -12, 2, 2);     // 右眼

    console.log('[PedestrianNPC] Character drawn with color 0x' + this.bodyColor.toString(16));
  }

  /**
   * 沿路径巡逻：走到终点后反向走回
   */
  _moveToNextWaypoint() {
    const target = this.waypoints[this.currentWaypointIdx];

    // 停止之前的 tween
    if (this.tween) {
      this.tween.stop();
    }

    // 计算朝向（用于翻转 sprite）
    const fromX = this.graphics.x;
    if (target.x > fromX) {
      this.graphics.setScale(1, 1);  // 面向右
    } else if (target.x < fromX) {
      this.graphics.setScale(-1, 1); // 面向左（水平翻转）
    }

    // 创建移动 tween
    this.tween = this.scene.tweens.add({
      targets: this.graphics,
      x: target.x,
      y: target.y,
      duration: this.speed,
      ease: 'Linear',
      onComplete: () => {
        // 巡逻逻辑：到终点反向，到起点正向
        if (this.currentWaypointIdx >= this.waypoints.length - 1) {
          this.direction = -1;
        } else if (this.currentWaypointIdx <= 0) {
          this.direction = 1;
        }

        this.currentWaypointIdx += this.direction;
        this._moveToNextWaypoint();  // 递归调用，继续巡逻
      }
    });
  }

  /**
   * 每帧更新（目前通过 tween 自动处理位置，无需额外逻辑）
   */
  update() {
    // Tween 会自动更新 graphics 的位置
    // 这里可以放额外的每帧逻辑，比如随机播放走路动画
  }
}


// =========================================================================
//  CarNPC — 彩色汽车，沿路径往返
// =========================================================================

class CarNPC {

  /**
   * @param {Phaser.Scene} scene
   * @param {Array<{x:number, y:number}>} waypoints — 路径点（建议2个点以上）
   * @param {object} options — 可选配置
   * @param {number} options.speed — 移动时间（毫秒），默认 3000
   * @param {number} options.color — 车身颜色 (hex)，默认 0xe94560
   * @param {number} options.width — 车身宽度，默认 40
   * @param {number} options.height — 车身高度，默认 18
   */
  constructor(scene, waypoints, options = {}) {
    this.scene = scene;
    this.waypoints = waypoints;
    this.currentWaypointIdx = 1;
    this.direction = 1;                // 1 = 正向，-1 = 反向
    this.speed = options.speed || 3000;
    this.color = options.color || 0xe94560;
    this.bodyWidth = options.width || 40;
    this.bodyHeight = options.height || 18;

    // ===== 绘制汽车 =====
    // 车身
    this.graphics = scene.add.graphics();
    this._drawCar();
    this.graphics.setDepth(9);  // 略低于行人
    this.graphics.setPosition(waypoints[0].x, waypoints[0].y);

    // 两个轮子（独立的 Graphics 对象，方便旋转）
    this.wheel1 = scene.add.graphics();
    this.wheel1.fillStyle(0x111111, 1);
    this.wheel1.fillCircle(0, 0, 4);
    this.wheel1.setDepth(10);

    this.wheel2 = scene.add.graphics();
    this.wheel2.fillStyle(0x111111, 1);
    this.wheel2.fillCircle(0, 0, 4);
    this.wheel2.setDepth(10);

    this._updateWheelPositions();

    // ===== 启动往返 Tween =====
    this._moveToNextWaypoint();

    console.log('[CarNPC] Car drawn with color 0x' + this.color.toString(16));
  }

  /**
   * 绘制汽车车身
   * 形状：圆角矩形车身 + 前窗 + 后窗
   */
  _drawCar() {
    const g = this.graphics;
    g.clear();
    const bw = this.bodyWidth;
    const bh = this.bodyHeight;

    // 车身主体
    g.fillStyle(this.color, 1);
    g.fillRoundedRect(-bw/2, -bh/2, bw, bh, 4);

    // 前挡风玻璃（浅蓝色小矩形）
    g.fillStyle(0x88ccff, 0.6);
    g.fillRect(bw/2 - 10, -bh/2 + 3, 7, bh - 6);

    // 后挡风玻璃
    g.fillStyle(0x88ccff, 0.4);
    g.fillRect(-bw/2 + 3, -bh/2 + 3, 7, bh - 6);

    // 车顶（稍深的颜色）
    g.fillStyle(Phaser.Display.Color.ValueToColor(this.color).darken(20).color, 1);
    g.fillRect(-bw/4, -bh/2 - 2, bw/2, bh/2 + 1);
  }

  /**
   * 更新轮子位置（跟随车身）
   */
  _updateWheelPositions() {
    const cx = this.graphics.x;
    const cy = this.graphics.y;
    const bw = this.bodyWidth;
    const bh = this.bodyHeight;

    this.wheel1.setPosition(cx - bw/4, cy + bh/2);
    this.wheel2.setPosition(cx + bw/4, cy + bh/2);
  }

  /**
   * 沿路径往返移动
   */
  _moveToNextWaypoint() {
    const target = this.waypoints[this.currentWaypointIdx];
    if (this.tween) this.tween.stop();

    // 朝向处理
    if (target.x > this.graphics.x) {
      this.graphics.setScale(1, 1);
    } else if (target.x < this.graphics.x) {
      this.graphics.setScale(-1, 1);
    }

    this.tween = this.scene.tweens.add({
      targets: this.graphics,
      x: target.x,
      y: target.y,
      duration: this.speed,
      ease: 'Linear',
      onUpdate: () => {
        // 每帧更新轮子位置
        this._updateWheelPositions();
      },
      onComplete: () => {
        // 往返逻辑
        if (this.currentWaypointIdx >= this.waypoints.length - 1) {
          this.direction = -1;
        } else if (this.currentWaypointIdx <= 0) {
          this.direction = 1;
        }
        this.currentWaypointIdx += this.direction;
        this._moveToNextWaypoint();
      }
    });
  }

  update() {
    // 位置由 tween 管理，轮子由 onUpdate 回调更新
  }
}
```

---

## 2. 在 `game.js` 中集成

在 `assets/js/game.js` 的 `create()` 方法中初始化 NPCManager 并创建 NPC：

```javascript
// ===== game.js =====

// 在文件顶部声明全局引用（放在类外部）
// let npcManager;   ← 如果使用模块化，可以直接放在 create 中

create() {
  // ... 已有的代码 ...

  // ==================== NPC 系统 ====================
  this.npcManager = new NPCManager(this);
  window.npcManager = this.npcManager;

  // —— 行人 NPC ——
  // 示例：沿水平路走动的行人
  const ped1 = new PedestrianNPC(this, [
    { x: 300, y: 450 },
    { x: 500, y: 450 },
    { x: 700, y: 450 },
  ], { speed: 3000, bodyColor: 0x4a90d9 });
  this.npcManager.add(ped1);

  // 行人2：沿垂直路走动的行人
  const ped2 = new PedestrianNPC(this, [
    { x: 200, y: 300 },
    { x: 200, y: 500 },
    { x: 200, y: 700 },
  ], { speed: 2500, bodyColor: 0xe67e22 });
  this.npcManager.add(ped2);

  // 行人3：斜穿广场的路人
  const ped3 = new PedestrianNPC(this, [
    { x: 100, y: 100 },
    { x: 300, y: 250 },
    { x: 500, y: 100 },
  ], { speed: 4000, bodyColor: 0x2ecc71 });
  this.npcManager.add(ped3);

  // —— 汽车 NPC ——
  // 示例：沿主路往返的红色汽车
  const car1 = new CarNPC(this, [
    { x: 100, y: 380 },
    { x: 400, y: 380 },
    { x: 700, y: 380 },
  ], { speed: 4000, color: 0xe94560 });
  this.npcManager.add(car1);

  // 汽车2：另一条路的蓝色汽车
  const car2 = new CarNPC(this, [
    { x: 50,  y: 520 },
    { x: 350, y: 520 },
    { x: 650, y: 520 },
    { x: 950, y: 520 },
  ], { speed: 3500, color: 0x3498db, width: 36, height: 16 });
  this.npcManager.add(car2);

  console.log('[game.js] NPCs initialized:', this.npcManager.npcs.length);
}
```

在 `update()` 方法中加入 NPC 更新调用：

```javascript
update(time, delta) {
  // ... 已有的代码（玩家移动等）...

  // ★ 更新所有 NPC
  if (this.npcManager) {
    this.npcManager.update();
  }
}
```

---

## 3. 视口裁剪的工作原理

```
┌────────────────────────────────────────┐
│         游戏世界 (2000 x 2000)          │
│                                        │
│    ┌──────────────────────┐            │
│    │   摄像机视口 (800x600) │            │
│    │                      │            │
│    │   NPC1 ● 可见        │            │
│    │   NPC2 ● 可见        │            │
│    │                      │            │
│    └──────────────────────┘            │
│                                        │
│    NPC3 ● 不可见（在屏幕外）             │
│      → graphics.setVisible(false)       │
│                                        │
│    NPC4 ● 不可见（在屏幕外）             │
│      → graphics.setVisible(false)       │
└────────────────────────────────────────┘
```

代码在 `NPCManager.update()` 中每一帧检查每个 NPC 是否在摄像机视口（含 50 像素缓冲区）内：

- **在视口内** → `setVisible(true)` — 正常渲染
- **在视口外** → `setVisible(false)` — 不渲染，节省 GPU 资源

---

## 4. 验证步骤

1. **打开游戏页面**，应看到彩色小人和汽车在地图上移动
2. **观察行人动画：**
   - 行人走到路径终点后会自动掉头走回
   - 行人朝向正确（面向移动方向）
3. **观察汽车动画：**
   - 汽车沿路径往返
   - 汽车轮子跟随车身移动
4. **测试视口裁剪：**
   - 移动玩家远离 NPC 区域
   - 打开控制台，取消注释 `NPCManager.update()` 中的 console.log
   - 确认可见 NPC 数量随视口变化
5. **打开控制台**，确认看到初始化日志：
   ```
   [NPCManager] Created
   [PedestrianNPC] Character drawn with color 0x4a90d9
   [CarNPC] Car drawn with color 0xe94560
   [NPCManager] Added NPC. Total: 1
   ...
   [game.js] NPCs initialized: 5
   ```

---

## 5. 常见坑点

| 问题 | 原因 | 解决方法 |
|------|------|----------|
| NPC 不显示 | Graphics 对象的坐标在摄像机范围外，或 depth 太低被遮挡 | 检查 `setDepth()` 值，确认 NPC 的初始位置在世界坐标中可见 |
| NPC 走到终点后消失 | `_moveToNextWaypoint()` 的索引越界 | 确保 waypoints 数组至少有 2 个点；检查方向反转逻辑 |
| 汽车轮子不跟随 | `_updateWheelPositions()` 未被调用 | 确认 `tween.onUpdate` 中调用了 `this._updateWheelPositions()` |
| 视口裁剪太激进（边缘闪烁） | 缓冲区太小 | 将 `bounds` 中的 50 像素缓冲增大（如 100） |
| 多个 NPC 重叠在一起 | 路径起点相同 | 给每个 NPC 设置不同的 waypoints |
| 翻转后轮子位置错误 | 轮子坐标未考虑 scale 翻转 | 轮子用 `setPosition` 单独设置，不跟随 `graphics.scaleX`，可改为在 update 中用独立坐标计算 |
| NPC 数量多时卡顿 | 每个 NPC 都有独立的 Graphics 对象 | 视口裁剪已大幅优化；进一步可将同类型 NPC 合并到一个 Graphics |

---

## 6. 扩展思路

完成基础 NPC 系统后，你可以：

1. **替换占位图形** — 后续有了 spritesheet 后，用 `scene.add.sprite()` 替代 `Graphics` 绘制
2. **添加对话** — 当玩家走近 NPC 时显示气泡文字（见第9章）
3. **随机路径** — 让 NPC 在路口随机选择方向，而非固定往返
4. **NPC 动画** — 给行人添加走路帧动画，汽车轮子旋转动画
5. **碰撞检测** — 玩家碰到汽车时播放"被撞"效果

---

## 章节小结

- **NPCManager** 统一管理所有 NPC 的创建、更新和视口裁剪
- **PedestrianNPC** 以路径点数组定义巡逻路线，到达端点自动反向
- **CarNPC** 与行人逻辑相似，但额外绘制了车身和轮子
- 视口裁剪通过 `setVisible()` 切换，大幅减少屏幕外对象的渲染开销
- 占位图形用纯色矩形绘制，后续可无缝替换为真实 spritesheet

下一章我们将实现交互区域系统，让玩家走到特定位置时触发模态窗口。
