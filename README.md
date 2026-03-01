# AI Office — VS Code Extension

A VS Code extension that embeds an **AI Office** companion panel with CSS Sprite animation.

---

## 📁 Project Structure

```
ai-office/
├── src/
│   ├── extension.ts                  # Entry point — registers commands
│   ├── panels/
│   │   └── AiOfficePanel.ts          # Webview panel lifecycle management
│   └── webview/
│       └── webviewContent.ts         # HTML/CSS/JS template for the webview
├── media/                            # Static assets (put your spritesheet here)
│   └── sprite.png                    # ← Replace with your actual spritesheet
├── package.json
├── tsconfig.json
└── .vscodeignore
```

---

## 🚀 Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Compile TypeScript
npm run compile

# 3. Open in VS Code and press F5 to launch Extension Development Host
```

---

## 🎮 Commands

| Command               | Title          | Description              |
|-----------------------|----------------|--------------------------|
| `ai-office.openPanel` | Open AI Office | Opens the AI Office panel |

---

## 🎨 Sprite Sheet Setup

The sprite animation is built with **CSS Keyframes + steps()** — no JS animation loop needed.

### Expected Spritesheet Layout

```
 ┌──────────────────────────────────────────────────────────────┐
 │  Row 0 (y=   0): idle    │ 4 frames × 96px │ 0.8s cycle      │
 │  Row 1 (y= -96): typing  │ 6 frames × 96px │ 0.6s cycle      │
 │  Row 2 (y=-192): reading │ 4 frames × 96px │ 1.2s cycle      │
 └──────────────────────────────────────────────────────────────┘
```

Each frame is **96 × 96 px**. Total sheet size: **576 × 288 px**.

### Connecting Your Sprite

In `src/webview/webviewContent.ts`, uncomment and point the URI:

```typescript
const spriteUri = webview.asWebviewUri(
  vscode.Uri.joinPath(extensionUri, 'media', 'sprite.png')
);
```

Then add to the `.sprite` CSS rule:

```css
.sprite {
  background-image: url('${spriteUri}');
  background-size: 576px 288px; /* total sheet dimensions */
}
```

---

## 📡 Messaging API

### Extension → Webview

```typescript
panel.setSpriteState('typing'); // 'idle' | 'typing' | 'reading'
```

### Webview → Extension

```javascript
vscode.postMessage({ command: 'setState', state: 'reading' });
```

---

## 🗺️ Sprite State Reference

| Class      | 意義         | Frames | Speed |
|------------|------------|--------|-------|
| `idle`     | 發呆 / 待機  | 4      | 0.8s  |
| `typing`   | 打字 / 寫程式 | 6      | 0.6s  |
| `reading`  | 讀取檔案     | 4      | 1.2s  |
