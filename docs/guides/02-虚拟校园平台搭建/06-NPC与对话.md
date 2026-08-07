# Phase 2 第 6 章：NPC 与对话系统

> **本章目标**：实现对话系统——玩家走到 NPC 旁按 E，弹出对话气泡，支持多轮对话和选项。
>
> **预计时间**：3-4 小时

---

## 6.1 对话数据格式 (JSON)

```json
{
  "dialogueId": "library_guide",
  "nodes": [
    {
      "id": 1,
      "npcText": "欢迎来到图书馆！需要帮忙吗？",
      "options": [
        {"text": "我想借书", "nextNodeId": 2},
        {"text": "随便看看", "nextNodeId": 3}
      ]
    },
    {
      "id": 2,
      "npcText": "借书请到二楼服务台，需要校园卡。",
      "options": []
    },
    {
      "id": 3,
      "npcText": "好的，有需要随时找我！",
      "options": [],
      "actions": [{"type": "complete_quest", "questId": 1}]
    }
  ]
}
```

---

## 6.2 前端对话 UI（DialogueUI 类）

```javascript
// dialogue-ui.js
class DialogueUI {
  constructor(scene) {
    this.scene = scene;
    this.container = null;
  }

  show(node, onSelect) {
    this.hide();
    const cam = this.scene.cameras.main;
    const cx = cam.width / 2;
    const bottom = cam.height - 20;

    this.container = this.scene.add.container(0, 0)
      .setScrollFactor(0).setDepth(2000);

    // 半透明黑色背景
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x000000, 0.85);
    bg.fillRoundedRect(cx - 260, bottom - 140, 520, 120, 4);
    this.container.add(bg);

    // NPC 说的话
    const text = this.scene.add.text(cx, bottom - 120, node.npcText, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '9px', color: '#ffffff',
      wordWrap: { width: 480 }, lineSpacing: 5
    }).setOrigin(0.5, 0);
    this.container.add(text);

    // 玩家选项
    if (node.options?.length > 0) {
      node.options.forEach((opt, i) => {
        const optText = this.scene.add.text(
          cx - 200 + i * 220, bottom - 20,
          `${i + 1}. ${opt.text}`,
          { fontFamily: '"Press Start 2P", monospace',
            fontSize: '8px', color: '#ffcc00' }
        ).setOrigin(0, 0.5).setInteractive();
        optText.on('pointerdown', () => onSelect(opt));
        this.container.add(optText);
      });
    } else {
      const hint = this.scene.add.text(cx, bottom - 5,
        'Press E to continue...',
        { fontFamily: '"Press Start 2P", monospace',
          fontSize: '7px', color: '#888' }
      ).setOrigin(0.5);
      this.container.add(hint);
    }
  }

  hide() {
    if (this.container) { this.container.destroy(); this.container = null; }
  }
}
```

---

## 6.3 后端对话 API

```go
// handler/npc.go
func GetNPCDialogue(c *gin.Context) {
    npcID := c.Param("npcId")
    var dialogueJSON string
    err := repository.DB.QueryRow(
        `SELECT d.data_json::text FROM dialogues d
         JOIN npcs n ON n.dialogue_id = d.id
         WHERE n.id = $1`, npcID,
    ).Scan(&dialogueJSON)
    if err != nil {
        c.JSON(404, gin.H{"error": "dialogue not found"}); return
    }
    c.JSON(200, gin.H{"dialogue": dialogueJSON})
}
```

---

## 6.4 NPC 交互流程

```
1. 玩家接近 NPC → 检测距离 < 40px → 显示 "Press E to talk to [NPC名称]"
2. 玩家按 E → game.js 调用:
   fetch(`/api/npcs/${npcId}/dialogue`)
     .then(r => r.json())
     .then(data => dialogueUI.show(data.dialogue.nodes[0]))
3. 对话 UI 显示 → 玩家点击选项 → 跳到对应 node
4. 最后一个 node（无选项）→ 按 E 关闭对话
5. 如果 node 有 actions → 执行（给道具、完成任务等）
```

---

## 6.5 验证方法

1. 走到 NPC 旁边 → 出现提示
2. 按 E → 对话气泡出现
3. 点击选项 → 对话推进
4. 对话结束 → 关闭
5. API: `curl localhost:8080/api/npcs/library_teacher/dialogue`

---

## 6.6 下一章

[第 7 章：任务系统](07-任务系统.md)
