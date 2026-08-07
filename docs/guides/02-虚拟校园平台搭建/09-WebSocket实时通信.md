# Phase 2 第 9 章：WebSocket 实时通信

> **本章目标**：实现 WebSocket 服务，让多个在线玩家看到彼此在地图上移动，支持地图聊天。
>
> **预计时间**：3-4 小时

---

## 9.1 WebSocket vs HTTP

```
HTTP:  客户端问 → 服务器答 → 结束（一问一答）
WebSocket: 客户端 ↔ 服务器（持续双向通道，适合实时数据）
```

WebSocket 用于：在线玩家位置同步、地图聊天、实时活动通知

---

## 9.2 Go WebSocket 服务

### 安装 Gorilla WebSocket

```bash
cd apps/server
go get github.com/gorilla/websocket
```

### 创建 `internal/ws/hub.go`

```go
package ws

import (
    "encoding/json"
    "sync"
    "github.com/gorilla/websocket"
)

// 全局在线玩家管理
var Hub = &GameHub{
    clients: make(map[*Client]bool),
}

type GameHub struct {
    clients map[*Client]bool
    mu      sync.RWMutex
}

type Client struct {
    Conn *websocket.Conn
    UserID int
    CampusID int
    MapID string
    X, Y float64
}

func (h *GameHub) Register(c *Client) {
    h.mu.Lock()
    h.clients[c] = true
    h.mu.Unlock()
    h.BroadcastPlayers(c.CampusID)
}

func (h *GameHub) Unregister(c *Client) {
    h.mu.Lock()
    delete(h.clients, c)
    h.mu.Unlock()
}

// BroadcastPlayers 向同一校园的所有玩家广播位置
func (h *GameHub) BroadcastPlayers(campusID int) {
    type PlayerInfo struct {
        UserID   int     `json:"userId"`
        Username string  `json:"username"`
        X        float64 `json:"x"`
        Y        float64 `json:"y"`
        MapID    string  `json:"mapId"`
    }

    h.mu.RLock()
    defer h.mu.RUnlock()

    // 收集同一校园的玩家
    players := []PlayerInfo{}
    for client := range h.clients {
        if client.CampusID == campusID {
            players = append(players, PlayerInfo{
                UserID: client.UserID,
                X: client.X, Y: client.Y,
                MapID: client.MapID,
            })
        }
    }

    msg, _ := json.Marshal(map[string]interface{}{
        "type": "players:update",
        "data": players,
    })

    // 广播
    for client := range h.clients {
        if client.CampusID == campusID {
            client.Conn.WriteMessage(websocket.TextMessage, msg)
        }
    }
}

// BroadcastChat 向同一地图的所有玩家广播聊天消息
func (h *GameHub) BroadcastChat(mapID string, userID int, message string) {
    h.mu.RLock()
    defer h.mu.RUnlock()

    msg, _ := json.Marshal(map[string]interface{}{
        "type": "chat:broadcast",
        "data": map[string]interface{}{
            "userId": userID,
            "message": message,
        },
    })

    for client := range h.clients {
        if client.MapID == mapID {
            client.Conn.WriteMessage(websocket.TextMessage, msg)
        }
    }
}
```

### 创建 `internal/ws/handler.go`

```go
package ws

import (
    "encoding/json"
    "log"
    "net/http"
    "github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
    CheckOrigin: func(r *http.Request) bool { return true },
}

func HandleWebSocket(c *gin.Context) {
    conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
    if err != nil { return }
    defer conn.Close()

    // 从 URL 参数获取用户信息
    token := c.Query("token")
    // 验证 JWT Token → 获取 userID

    client := &Client{Conn: conn, UserID: 1, CampusID: 1}
    Hub.Register(client)
    defer Hub.Unregister(client)

    // 读取客户端消息
    for {
        _, msgBytes, err := conn.ReadMessage()
        if err != nil { break }

        var msg map[string]interface{}
        json.Unmarshal(msgBytes, &msg)

        switch msg["type"] {
        case "player:move":
            data := msg["data"].(map[string]interface{})
            client.X = data["x"].(float64)
            client.Y = data["y"].(float64)
            client.MapID = data["mapId"].(string)
            Hub.BroadcastPlayers(client.CampusID)

        case "chat:send":
            data := msg["data"].(map[string]interface{})
            message := data["message"].(string)
            Hub.BroadcastChat(client.MapID, client.UserID, message)
        }
    }
}
```

### 在 main.go 中添加路由

```go
r.GET("/ws", ws.HandleWebSocket)
```

---

## 9.3 前端 WebSocket 集成

```javascript
// ws-client.js
class GameWebSocket {
  constructor(token, campusId) {
    this.ws = new WebSocket(`ws://localhost:8080/ws?token=${token}`);
    this.campusId = campusId;
    this.otherPlayers = {}; // userId → sprite

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      switch (msg.type) {
        case 'players:update':
          this.updateOtherPlayers(msg.data);
          break;
        case 'chat:broadcast':
          this.showChatBubble(msg.data);
          break;
      }
    };
  }

  sendPosition(x, y, mapId) {
    this.ws.send(JSON.stringify({
      type: 'player:move',
      data: { x, y, mapId }
    }));
  }

  sendChat(message) {
    this.ws.send(JSON.stringify({
      type: 'chat:send',
      data: { message }
    }));
  }

  updateOtherPlayers(players) {
    // 更新其他玩家的位置精灵
    players.forEach(p => {
      if (p.userId === this.myUserId) return;
      // 创建或移动对应玩家的精灵
    });
  }
}
```

---

## 9.4 消息协议

```json
// 客户端 → 服务端
{"type":"player:move",  "data":{"x":100,"y":200,"mapId":"main"}}
{"type":"player:interact","data":{"npcId":"library_teacher"}}
{"type":"chat:send",    "data":{"message":"Hello!"}}

// 服务端 → 客户端
{"type":"players:update", "data":[{"userId":1,"x":100,"y":200}]}
{"type":"chat:broadcast", "data":{"userId":1,"message":"Hello!"}}
{"type":"event:start",    "data":{"eventId":1,"name":"迎新活动"}}
```

---

## 9.5 验证方法

1. 启动后端 → `go run cmd/main.go`
2. 用两个浏览器窗口打开游戏
3. 窗口 A 移动角色 → 窗口 B 应该能看到另一个玩家在移动
4. 窗口 A 发聊天 → 窗口 B 收到气泡

---

## 9.6 下一章

[第 10 章：后台管理系统](10-后台管理.md)
