# 第 2 章：CSS 样式 — 让网站变成复古游戏风格

> **本章目标**：写完 `styles.css`，让整个网站从白底黑字变成 NES 复古 RPG 游戏风格。
>
> **预计时间**：2-3 小时

---

## 2.1 你将创建的文件

| 文件 | 操作 |
|------|------|
| `assets/css/styles.css` | 新建 |

---

## 2.2 CSS 的分类

我们按功能把样式分成 8 组，一组一组写：

| 组                 | 功能              | 关键效果                     |
| ----------------- | --------------- | ------------------------ |
| 1. 全局基础           | 光标/盒模型/滚动条/字体   | 像素十字光标、Press Start 2P 字体 |
| 2. 预加载器           | Loading 动画和进度条  | 居中布局、进度条填充动画             |
| 3. Play 界面        | Logo + Play 按钮  | 全屏居中、按钮放大                |
| 4. 模态窗口通用         | 弹窗容器/遮罩/关闭按钮    | 显隐切换、滚动、像素边框             |
| 5. 内容样式           | 技术卡片/CV/项目/卡片特效 | 布局、全息光效、3D 旋转            |
| 6. Big Map        | 全局地图 + CRT 效果   | RGB 分离、扫描线、VHS 噪点        |
| 7. Under the Hood | 标签页切换           | 侧边导航 + 内容区               |
| 8. 移动端适配          | 响应式/横屏提示        | 媒体查询、虚拟摇杆区域              |

---

## 2.3 完整 CSS 代码

创建 `assets/css/styles.css`，将以下内容全部复制进去：

```css
/* ============================================
   styles.css — Virtual Campus / Portfolio
   配合 NES.css 2.3 + Press Start 2P 字体
   ============================================ */

/* ==========================================
   第 1 组：全局基础样式
   ========================================== */

/* 自定义像素十字光标（Base64 编码的 PNG） */
html, body {
  cursor: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAzElEQVRYR+2X0Q6AIAhF5f8/2jYXZkwEjNSVvVUjDpcrGgT7FUkI2D9xRfQETwNIiWO85wfINfQUEyxBG2ArsLwC0jioGt5zFcwF4OYDPi/mBYKm4t0U8ATgRm3ThFoAqkhNgWkA0jJLvaOVSs7j3qMnSgXWBMiWPXe94QqMBMBc1ZI1kPqTu5u5pQewq0EqNZvIEMCmxAawK0DNkay9QmfFNAJUXfgGgUkLaE7j/h8fnASkxHTz0DGIBMCnBeeM7AArpUd3mz2x3C7wADglA8BcWMZhZAAAAAElFTkSuQmCC) 14 0, auto;
}

*, *:before, *:after { box-sizing: border-box; }

/* 自定义滚动条 */
html {
  scrollbar-width: thin;
  scrollbar-color: rgba(0,0,0,0.4) transparent;
}
*::-webkit-scrollbar { width: 8px; height: 8px; }
*::-webkit-scrollbar-track { background-color: transparent; }
*::-webkit-scrollbar-thumb {
  background-color: rgba(0,0,0,0.4);
  border-radius: 9999px;
  border: 2px solid transparent;
  background-clip: content-box;
}

/* 基础布局 */
html, body {
  margin: 0; padding: 0;
  line-height: 0;
  overflow: hidden;          /* 游戏全屏，无浏览器滚动条 */
  font-family: "Press Start 2P", monospace;
}

/* 去除所有焦点轮廓（游戏不需要键盘焦点环） */
* { outline: none !important; }
*:focus, *:focus-visible { outline: none !important; box-shadow: none !important; }

/* ==========================================
   第 2 组：预加载器
   ========================================== */

.progress-percentage {
  position: absolute;
  left: 0; top: 50%;
  margin-top: -230px;
  padding: 0;
  color: #000;
  font-size: 25px;
  width: 100%;
  line-height: 1em;
  text-align: center;
  z-index: 99999;
  opacity: 1;
  transition: opacity 0.5s ease-in-out;
}

.preloader-image {
  image-rendering: pixelated;
  max-width: 310px;
  max-height: 310px;
}

.preloader {
  width: 300px; height: 20px;
  border: 4px solid #000;
  margin: 20px auto;
  background: #fff;
}

.preloader .bar {
  height: 100%;
  background: #000;
  transition: width 0.3s ease;
}

.preloader-text {
  font-family: "Press Start 2P", monospace;
  font-size: 14px;
  color: #000;
  margin-bottom: 10px;
}

/* ==========================================
   第 3 组：Play 界面
   ========================================== */

.play-box {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  z-index: 100000;
  background: #fff;
}

.play-box .wrp {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.play-box .img-wrp { text-align: center; }

.play-box .img-wrp img {
  image-rendering: pixelated;
  max-width: 441px;
  max-height: 282px;
}

.btn-wrp { margin-top: 30px; }
.btn-play { font-size: 24px !important; padding: 15px 40px !important; }

.mini-text {
  text-align: center; padding: 20px;
  font-family: "Press Start 2P", monospace;
  font-size: 12px;
}

.highlight-text { background: #ff0; padding: 2px 5px; }

.linkedin-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
}

/* ==========================================
   第 4 组：模态窗口通用
   ========================================== */

.game-container {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
}

.game-container canvas {
  image-rendering: pixelated;    /* 像素渲染，边缘不模糊 */
}

.modal {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  z-index: 1000;
  visibility: hidden;            /* 默认隐藏 */
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal.active { visibility: visible; }

.modal-backdrop {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0,0,0,0.5);
  z-index: 999;
  visibility: hidden;
}

.modal-backdrop.active { visibility: visible; }

.frame-wrp {
  width: 100%; height: 100%;
  overflow-y: auto;
  padding: 20px;
}

.frame-wrp-inner {
  position: relative;
  display: flex;
  justify-content: center;
  min-height: 100%;
  align-items: flex-start;
  padding-top: 60px;
}

.frame {
  width: 100%;
  background: #fff;
  padding: 30px;
  position: relative;
}

/* 像素边框（用 box-shadow 模拟像素风格的粗边框） */
.pixel-corners {
  border: 4px solid #000;
  box-shadow: 0 0 0 4px #fff, 0 0 0 8px #000;
}

.pixel-corners-mini {
  border: 2px solid #000;
  box-shadow: 0 0 0 2px #fff, 0 0 0 4px #000;
}

/* 关闭按钮 */
.close-btn {
  position: absolute !important;
  top: 10px; right: 10px;
  z-index: 10;
  font-size: 20px !important;
  width: 40px; height: 40px;
  padding: 0 !important;
  line-height: 40px;
}

/* ==========================================
   第 5 组：内容样式
   ========================================== */

.big-title {
  font-family: "Press Start 2P", monospace;
  font-size: 24px;
  text-align: center;
  margin-bottom: 30px;
}

.text-center { text-align: center; }
.text-content {
  font-family: "Press Start 2P", monospace;
  font-size: 12px;
  line-height: 2;
  color: #333;
}

/* 技术栈卡片 */
.tech-cols {
  display: flex;
  align-items: center;
  gap: 30px;
  padding: 20px 0;
  border-bottom: 2px solid #eee;
}

.tech .logo img {
  width: 120px; height: auto;
  image-rendering: pixelated;
}

.tech .title {
  font-family: "Press Start 2P", monospace;
  font-size: 16px;
  margin: 0 0 5px 0;
}

.tech .desc { font-size: 14px; color: #666; margin-bottom: 10px; line-height: 1.5; }
.tech p { font-size: 13px; line-height: 1.5; }

.other-title {
  font-family: "Press Start 2P", monospace;
  font-size: 14px;
  margin-top: 30px;
}

/* 用户信息卡片 */
.user-box {
  display: flex; align-items: center; gap: 20px;
  padding: 20px; margin-bottom: 30px;
  flex-wrap: wrap;
}

.user-box .img img { width: 120px; height: 120px; }
.user-box strong { font-family: "Press Start 2P", monospace; font-size: 14px; }
.user-box .mini { font-size: 11px; color: #666; margin-top: 5px; line-height: 1.5; }

/* 文字块 */
.text-block { margin-bottom: 20px; line-height: 2; }
.text-block .title { font-size: 14px; margin-bottom: 10px; }

/* CV 时间线 */
.cv .line {
  width: 2px; background: #000;
  position: absolute; left: 50%; top: 0; bottom: 0;
}

.cv-item { display: flex; margin-bottom: 40px; gap: 30px; }
.cv-item .emp-wrp { flex: 0 0 200px; text-align: center; }
.cv-item .emp-logo { max-width: 100px; height: auto; }
.cv-item .date { font-size: 11px; margin-top: 10px; color: #666; }
.cv-item .data { flex: 1; }
.cv-item .company-title { font-size: 14px; margin-bottom: 5px; }
.cv-item .job-title { font-size: 11px; color: #666; margin-bottom: 10px; line-height: 1.5; }
.cv-item .job-desc { font-size: 11px; line-height: 1.8; }

.cv-projects-list { display: none; margin-top: 10px; padding: 10px; background: #f9f9f9; }
.cv-projects-list.open { display: block; }
.cv-projects-toggle { margin: 10px 0; }

/* 项目卡片 */
.portfolio-item h3 { font-size: 16px; margin-bottom: 5px; }
.portfolio-item .subtitle { font-size: 12px; color: #666; margin-bottom: 10px; line-height: 1.5; }
.tech-used { display: flex; flex-wrap: wrap; gap: 10px; padding: 0; list-style: none; }
.tech-used li { background: #eee; padding: 5px 10px; font-size: 11px; }

/* 卡片特效 */
.card-wrp { display: flex; gap: 30px; flex-wrap: wrap; }
.col.card { flex: 0 0 250px; position: relative; }
.card-text.col { flex: 1; min-width: 280px; }

/* 触摸提示动画 */
.touch-me {
  position: absolute; top: -50px; right: -30px;
  width: 60px; height: 60px; z-index: 5;
  animation: touch-me-hint 2s ease-in-out infinite;
}
.touch-me img { width: 100%; height: auto; }

@keyframes touch-me-hint {
  0%, 100% { transform: translate(-15px, -15px); }
  50% { transform: translate(15px, 15px); }
}

/* 全息卡片 3D 效果 */
.card { perspective: 1000px; }
.card__translater { transition: transform 0.1s ease; }
.card__rotator { transition: transform 0.1s ease; }
.card__front { position: relative; overflow: hidden; }
.effect-card-img { width: 100%; height: auto; display: block; image-rendering: pixelated; }

.card__shine {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(
    135deg,
    transparent 0%,
    rgba(255,255,255,0.3) 30%,
    rgba(255,255,255,0.6) 50%,
    rgba(255,255,255,0.3) 70%,
    transparent 100%
  );
  opacity: 0; transition: opacity 0.3s;
}

.card:hover .card__shine,
.card.interactive:hover .card__shine { opacity: 1; }

.card__glare {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: radial-gradient(
    circle at 50% 50%,
    rgba(255,255,255,0.5) 0%,
    transparent 60%
  );
  opacity: 0; pointer-events: none;
}

/* Memo 导航 */
.memo-nav-wrapper {
  display: flex; align-items: center; justify-content: center;
  gap: 15px; margin-top: 20px;
}

.memo-nav-arrow {
  background: none; border: none;
  font-size: 30px; cursor: pointer;
  font-family: "Press Start 2P", monospace; color: #000;
}

.memo-hamburger-btn {
  display: flex; flex-direction: column; gap: 4px;
  background: none; border: none; cursor: pointer; padding: 5px;
}

.memo-hamburger-btn span {
  display: block; width: 20px; height: 2px; background: #000;
}

/* ==========================================
   第 6 组：Big Map + CRT/VHS 效果
   ========================================== */

.big-map-modal .big-map-backdrop {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.8); z-index: -1;
}

.big-map-wrapper { position: relative; }
.big-map-container { position: relative; display: inline-block; }

.big-map-container img {
  image-rendering: pixelated;
  width: 100%;
  max-width: 800px;
}

.big-map-legend {
  display: flex; gap: 20px; margin-bottom: 20px;
  font-size: 11px; color: #fff;
}

/* CRT 显示器遮罩（横向扫描线） */
.big-map-monitor-overlay {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: repeating-linear-gradient(
    0deg,
    rgba(0,0,0,0.15) 0px,
    rgba(0,0,0,0.15) 1px,
    transparent 1px,
    transparent 3px
  );
  pointer-events: none; z-index: 2;
}

/* RGB 色彩分离（模拟老电视的色差） */
.vhs-rgb-layer {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none;
  mix-blend-mode: screen;
  opacity: 0.1;
}

.vhs-rgb-layer.red {
  background: rgba(255,0,0,0.05);
  animation: rgb-shift 0.5s infinite alternate;
}

.vhs-rgb-layer.blue {
  background: rgba(0,0,255,0.05);
  animation: rgb-shift 0.3s infinite alternate-reverse;
}

@keyframes rgb-shift {
  0% { transform: translate(0, 0); }
  100% { transform: translate(3px, 0); }
}

/* 扫描线（从上往下移动的横线） */
.vhs-scanline-bar {
  position: absolute; top: 0; left: 0; right: 0;
  height: 5px;
  background: rgba(255,255,255,0.1);
  animation: scanline 3s linear infinite;
  pointer-events: none; z-index: 3;
}

@keyframes scanline {
  0% { top: 0; }
  100% { top: 100%; }
}

/* ==========================================
   第 7 组：Under the Hood 标签页
   ========================================== */

.under-hood-layout { display: flex; gap: 30px; }

.under-hood-nav {
  flex: 0 0 200px;
  display: flex; flex-direction: column; gap: 2px;
}

.under-hood-nav-item {
  font-family: "Press Start 2P", monospace;
  font-size: 10px; padding: 10px;
  background: #eee;
  border: 2px solid transparent;
  cursor: pointer; text-align: left;
}

.under-hood-nav-item.active { background: #000; color: #fff; }

.under-hood-content { flex: 1; min-height: 300px; }

.under-hood-section { font-size: 12px; line-height: 1.8; }
.under-hood-section h3 { font-size: 14px; margin-bottom: 15px; }

/* ==========================================
   第 8 组：响应式与移动端
   ========================================== */

@media (max-height: 450px) {
  .progress-percentage { margin-top: -200px; }
}

@media (max-width: 768px) {
  .tech-cols { flex-direction: column; text-align: center; }
  .user-box { flex-direction: column; text-align: center; }
  .card-wrp { flex-direction: column; align-items: center; }
  .cv-item { flex-direction: column; }
  .under-hood-layout { flex-direction: column; }
  .under-hood-nav { flex-direction: row; flex-wrap: wrap; flex: auto; }
  .big-title { font-size: 16px; }
  .frame { padding: 15px; }
}

/* 横屏提示（手机竖屏时显示） */
.landscape-overlay {
  display: none;
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: #000;
  z-index: 9999999;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  color: #fff;
  font-family: "Press Start 2P", monospace;
  font-size: 14px;
}

@media (orientation: portrait) and (max-width: 768px) {
  .landscape-overlay { display: flex; }
}

/* ==========================================
   工具类
   ========================================== */

.visually-hidden {
  position: absolute;
  width: 1px; height: 1px;
  margin: -1px; padding: 0;
  overflow: hidden;
  clip: rect(0,0,0,0);
  border: 0;
}

.space-down { margin-bottom: 20px; }
.up-btn { margin-top: 30px; }
.mini-p { font-size: 11px; line-height: 1.8; margin-bottom: 10px; }
```

---

## 2.4 验证方法

1. 保存 `styles.css`
2. 刷新浏览器（如果 Live Server 开着会自动刷新）
3. 观察以下变化：
   - 鼠标光标变成了像素十字准星
   - 字体变成了 "Press Start 2P" 像素字体（`Loading...` 文字明显变化）
   - 滚动条变细了
4. 按 `F12` → Network 标签，确认 `styles.css` 返回 200
5. 如果用手机模式（F12 → Toggle device toolbar），竖屏应该看到"Rotate your device"提示

---

## 2.5 常见踩坑

**Q：字体没变化？**
A：Google Fonts 在国内可能被墙。解决：
1. 到 https://fonts.google.com/specimen/Press+Start+2P 下载字体文件
2. 放到 `assets/fonts/` 下
3. 用 `@font-face` 在 CSS 中加载本地字体

```css
@font-face {
  font-family: "Press Start 2P";
  src: url("../fonts/PressStart2P-Regular.ttf") format("truetype");
}
```

**Q：NES 按钮没样式？**
A：NES.css 要求按钮同时使用 `nes-btn` 类 + 颜色类（如 `is-error` 红色、`is-primary` 蓝色）。同时必须是 `<button>` 或 `<a>` 标签。

**Q：像素边框不显示？**
A：`.pixel-corners` 使用 `box-shadow` 模拟边框。确保元素有 `background: #fff`（透明背景会让边框和白线看不太清）。

---

## 2.6 进入下一章

完成本章后 → [第 3 章：Phaser 3 初始化](03-Phaser初始化.md)
