# 第 3 章：Phaser 3 初始化 — 让游戏画布跑起来

> **本章目标**：创建 Phaser 游戏实例，在网页上显示一个黑色画布，理解 Phaser 的生命周期。
>
> **预计时间**：2-3 小时

---

## 3.1 Phaser 3 是什么？

Phaser 3 是一个 HTML5 游戏框架。它封装了 Canvas/WebGL 的复杂操作，让你用简单的代码创建游戏。

```
你写的 JS 代码 → Phaser 引擎 → Canvas / WebGL → 浏览器渲染到屏幕
```

**Phaser 的核心概念**：

| 概念 | 比喻 | 说明 |
|------|------|------|
| **Game** | 游戏主机 | 最顶层对象，管理整个游戏生命周期 |
| **Scene** | 游戏关卡 | 一个 Game 可以有多个 Scene（菜单、地图、结算画面） |
| **Camera** | 摄影机 | 控制玩家看到画面的哪个部分 |
| **Sprite** | 角色/道具 | 游戏中可移动的可见对象 |
| **Tilemap** | 地图拼图 | 用"瓦片"拼接成的游戏地图 |

---

## 3.2 Phaser 的生命周期

```
new Phaser.Game(config)
    │
    ▼
preload()   ← 加载资源（图片、地图JSON、音频）
    │
    ▼
create()    ← 创建游戏对象（地图、玩家、NPC、UI）
    │
    ▼
update()    ← 每帧调用（60fps = 每秒60次，处理移动、碰撞、输入）
    │
    ▼
（循环 update 直到场景切换或游戏结束）
```

---

## 3.3 你将创建的文件

| 文件 | 操作 |
|------|------|
| `assets/js/game.js` | 新建 — Phaser 游戏场景 |
| `assets/js/main.js` | 新建 — 入口文件，启动流程 |

---

## 3.4 逐步操作

### Step 1：创建 `assets/js/game.js`

```javascript
/**
 * game.js — Phaser 3 游戏场景
 *
 * 这里定义游戏的"主场景"，即玩家进入后看到的地图世界。
 * Phaser 自动调用：
 *   preload() → 加载资源
 *   create()  → 构建游戏世界
 *   update()  → 每帧更新（60 次/秒）
 */

class GameScene extends Phaser.Scene {

  constructor() {
    // 'GameScene' 是场景的名字，后续切换场景时用到
    super({ key: 'GameScene' });
  }

  // ----- 第 1 步：加载资源 -----
  preload() {
    console.log('🔵 preload() 开始加载资源...');

    // 加载瓦片集图片（地图的"积木块"）
    this.load.image('tileset', 'assets/maps/exterior.png');
    this.load.image('collision-tiles', 'assets/maps/collisions-objects.png');

    // 加载地图 JSON 数据
    this.load.json('map-data', 'assets/maps/final_map.json');
    this.load.json('walls-data', 'assets/maps/walls-layer.json');

    // 监听加载进度
    this.load.on('progress', (value) => {
      // value 范围：0 ~ 1（0.5 代表加载了 50%）
      const percent = Math.floor(value * 100);
      document.getElementById('progress-bar').style.width = percent + '%';
      document.getElementById('progress-text').textContent = percent + '%';
    });

    // 加载完成回调
    this.load.on('complete', () => {
      console.log('🟢 preload() 所有资源加载完毕！');
    });
  }

  // ----- 第 2 步：创建游戏世界 -----
  create() {
    console.log('🟢 create() 开始创建游戏世界...');

    // 获取在 preload 中加载的地图数据
    const mapData = this.cache.json.get('map-data');
    if (mapData) {
      console.log('地图尺寸:', mapData.width + '×' + mapData.height);
    }

    // 设置黑色背景
    this.cameras.main.setBackgroundColor('#000000');

    // 在画布中央显示一段测试文字
    this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      'Game is running!\nUse arrow keys to move.',
      {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '8px',
        color: '#ffffff',
        align: 'center',
        lineSpacing: 10
      }
    ).setOrigin(0.5); // 0.5 = 居中对齐（默认是左上角）
  }

  // ----- 第 3 步：每帧更新 -----
  update(time, delta) {
    // time:  游戏启动以来的总时间（毫秒）
    // delta: 距上一帧的时间差（毫秒），约 16.7ms @ 60fps
    // 后续章节在这里添加移动、碰撞检测等逻辑
  }
}

// 暴露到全局（各 JS 文件用 window 共享）
window.GameScene = GameScene;
```

### Step 2：创建 `assets/js/main.js`

```javascript
/**
 * main.js — 应用入口
 *
 * 负责整个流程：
 *   1. 模拟预加载（进度条动画）
 *   2. 显示 Play 按钮
 *   3. 用户点击 Play → 启动 Phaser 游戏
 */

// ===== 模拟加载（后续会被 Phaser 的真实 preload 替代） =====
function simulateLoading() {
  return new Promise((resolve) => {
    let progress = 0;
    const interval = setInterval(() => {
      // 随机增加进度，模拟真实加载
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);

        // 延迟 500ms 让用户看到 100%
        setTimeout(() => {
          // 隐藏预加载器，显示 Play 按钮
          document.getElementById('preloader-screen').style.display = 'none';
          document.getElementById('play-box').style.display = '';
          document.getElementById('init-load').style.display = 'none';
          resolve();
        }, 500);
      }

      // 更新进度条和百分比
      document.getElementById('progress-bar').style.width = Math.floor(progress) + '%';
      document.getElementById('progress-text').textContent = Math.floor(progress) + '%';
    }, 200);
  });
}

// ===== 启动 Phaser 游戏 =====
function initGame() {
  // 隐藏 Play 界面，显示游戏画布
  document.getElementById('play-box').style.display = 'none';
  document.getElementById('main-content').style.display = '';

  // 创建 Phaser.Game 实例——这是整个游戏引擎的核心
  const game = new Phaser.Game({

    // ---- 渲染方式 ----
    type: Phaser.AUTO,        // 优先 WebGL，不支持时自动用 Canvas
    width: 480,               // 内部渲染宽度（像素）
    height: 270,              // 内部渲染高度（像素）
    // 为什么 480×270？像素游戏常用低分辨率渲染再 CSS 拉伸，
    // 这样能获得清晰的像素感
    parent: 'game-div',       // canvas 插入到这个 DOM 元素中

    // ---- 缩放 ----
    scale: {
      mode: Phaser.Scale.FIT,            // 等比缩放填满窗口
      autoCenter: Phaser.Scale.CENTER_BOTH // 居中
    },

    // ---- 像素渲染 ----
    render: {
      pixelArt: true,          // 不模糊，保持像素风格的锐利边缘
      antialias: false,        // 关闭抗锯齿
      roundPixels: true        // 像素对齐，防止半像素渲染
    },

    // ---- 物理引擎 ----
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },    // 俯视角游戏不需要重力
        debug: false           // 设 true 可看到碰撞框（开发时有用）
      }
    },

    // ---- 背景色 ----
    backgroundColor: '#000000',

    // ---- 场景列表 ----
    scene: [window.GameScene]
  });

  console.log('🟢 Phaser.Game 创建完毕！');
  console.log('   画布:', game.canvas.width + '×' + game.canvas.height);

  // 存到全局，方便其他模块访问
  window.game = game;
}

// ===== 页面加载完成后自动执行 =====
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 启动流程开始');

  // 1. 检查 Phaser 是否加载
  if (typeof Phaser === 'undefined') {
    console.error('❌ Phaser 未加载！检查 assets/js/phaser.min.js 是否存在');
    return;
  }
  console.log('✅ Phaser 版本:', Phaser.VERSION);

  // 2. 模拟预加载
  await simulateLoading();

  // 3. 绑定 Play 按钮
  document.getElementById('btn-play').addEventListener('click', () => {
    console.log('🎮 用户点击 Play');
    initGame();
  });

  console.log('✅ 等待用户点击 Play...');
});
```

**为什么 `main.js` 放在最后加载？**
因为它依赖 `game.js`（需要 `window.GameScene` 存在）。在 `index.html` 中，`<script>` 标签按顺序执行，所以要确保依赖被先加载。

---

## 3.5 验证方法

1. 确保以下文件已创建：
   - `assets/js/game.js`
   - `assets/js/main.js`
2. 在 `index.html` 中，**暂时注释掉**其他还不存在的 JS 引用：
   ```html
   <script src="assets/js/phaser.min.js"></script>
   <!-- <script src="assets/js/modal-manager.js"></script> -->
   <!-- <script src="assets/js/i18n.js"></script> -->
   <!-- ... -->
   <script src="assets/js/game.js"></script>
   <script src="assets/js/main.js"></script>
   ```
3. 刷新浏览器
4. 预期流程：
   - 白色 Loading 页面 → 进度条走到 100%
   - 显示 Logo + Play 按钮（Logo 是 404 没关系，图片还没放）
   - 点击 Play 按钮
   - 黑色画布出现，中央显示白色文字："Game is running! Use arrow keys to move."
5. 按 F12 → Console，预期输出：
   ```
   🚀 启动流程开始
   ✅ Phaser 版本: 3.60.0
   🔵 preload() 开始加载资源...
   🟢 preload() 所有资源加载完毕！
   🟢 create() 开始创建游戏世界...
   🟢 Phaser.Game 创建完毕！
   ```

---

## 3.6 常见踩坑

**Q：点击 Play 无反应？**
A：F12 Console 看报错。最常的原因是 `phaser.min.js` 路径不对或文件不存在（404）。检查 Network 标签。

**Q："Phaser is not defined"？**
A：`phaser.min.js` 在 `main.js` 之后加载了。检查 index.html 中 script 标签的顺序——phaser 必须排第一。

**Q：画面模糊？**
A：检查 `pixelArt: true` 和 `render.roundPixels: true` 是否都设置了。CSS 中也检查 `.game-container canvas` 的 `image-rendering: pixelated`。

**Q：没有进度条？**
A：`simulateLoading()` 是模拟加载，和 Phaser 的 `preload()` 是分开的。本章先用模拟进度条，让用户看到 Play 按钮后再初始化游戏。真正的 Phaser preload 进度后面章节会整合。

---

## 3.7 进入下一章

完成本章后 → [第 4 章：瓦片地图](04-瓦片地图.md)
