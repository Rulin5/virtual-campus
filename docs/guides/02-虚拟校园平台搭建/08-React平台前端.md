# Phase 2 第 8 章：React 平台前端

> **本章目标**：用 React + Zustand 搭建登录页、校园选择页、个人中心。
>
> **预计时间**：3-4 小时

---

## 8.1 页面结构

```
/login          → 登录/注册页
/campuses       → 校园选择页（卡片列表）
/campus/:slug   → 游戏页（嵌入 Phaser Canvas）
/profile        → 个人中心（角色、背包、任务进度）
```

---

## 8.2 Zustand 状态管理

```typescript
// apps/web/src/stores/auth.ts
import { create } from 'zustand';

interface AuthState {
  token: string | null;
  user: { id: number; username: string } | null;
  login: (token: string, user: any) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: null,
  login: (token, user) => {
    localStorage.setItem('token', token);
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null });
  },
}));
```

---

## 8.3 登录页

```tsx
// apps/web/src/pages/Login.tsx
import { useState } from 'react';
import { useAuth } from '../stores/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useAuth(s => s.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.token) {
      login(data.token, data.user);
      window.location.href = '/campuses';
    }
  };

  return (
    <div style={{ fontFamily: '"Press Start 2P", monospace',
                  maxWidth: 400, margin: '100px auto', padding: 20 }}>
      <h2>🎮 Virtual Campus</h2>
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email"
               value={email} onChange={e => setEmail(e.target.value)}
               className="nes-input" style={{ marginBottom: 10 }} />
        <input type="password" placeholder="Password"
               value={password} onChange={e => setPassword(e.target.value)}
               className="nes-input" style={{ marginBottom: 20 }} />
        <button type="submit" className="nes-btn is-primary"
                style={{ width: '100%' }}>Login</button>
      </form>
      <p style={{ textAlign: 'center', marginTop: 15, fontSize: 10 }}>
        No account? <a href="/register">Register</a>
      </p>
    </div>
  );
}
```

---

## 8.4 校园选择页

```tsx
// apps/web/src/pages/Campuses.tsx
import { useEffect, useState } from 'react';

interface Campus {
  id: number; name: string; slug: string;
}

export default function Campuses() {
  const [campuses, setCampuses] = useState<Campus[]>([]);

  useEffect(() => {
    fetch('/api/campuses')
      .then(r => r.json())
      .then(d => setCampuses(d.data));
  }, []);

  return (
    <div style={{ maxWidth: 800, margin: '50px auto', padding: 20 }}>
      <h2 style={{ fontFamily: '"Press Start 2P"', fontSize: 18 }}>
        Select Campus
      </h2>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 30 }}>
        {campuses.map(c => (
          <a key={c.id} href={`/campus/${c.slug}`}
             className="nes-btn" style={{ padding: '30px 40px', textDecoration: 'none' }}>
            <div style={{ fontSize: 14, fontFamily: '"Press Start 2P"' }}>{c.name}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
```

---

## 8.5 游戏嵌入页

```tsx
// apps/web/src/pages/CampusPage.tsx
import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';

export default function CampusPage() {
  const { slug } = useParams();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 动态加载 Phaser 游戏
    const script = document.createElement('script');
    script.src = '/game/assets/js/phaser.min.js';
    script.onload = () => {
      // Phaser 加载完毕后初始化游戏
      // initPhaserGame(containerRef.current!, slug!);
    };
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, [slug]);

  return <div ref={containerRef} id="game-container"
              style={{ width: '100vw', height: '100vh' }} />;
}
```

---

## 8.6 路由配置

```tsx
// apps/web/src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Campuses from './pages/Campuses';
import CampusPage from './pages/CampusPage';
import Profile from './pages/Profile';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/campuses" element={<Campuses />} />
        <Route path="/campus/:slug" element={<CampusPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 8.7 验证方法

1. `pnpm dev`（在 `apps/web/` 下）→ 打开 http://localhost:5173
2. 看到登录页 → 输入账号密码 → 登录成功 → 跳转校园选择
3. 点击校园卡片 → 进入游戏页
4. 游戏 Canvas 嵌入在 React 页面中

---

## 8.8 下一章

[第 9 章：WebSocket 实时通信](09-WebSocket实时通信.md)
