import * as vscode from 'vscode';

// ─────────────────────────────────────────────────────────────────────────────
//  琥珀 Sprite Sheet 規格
//
//  圖片尺寸 : 1000 × 545 px
//  格子大小 : 250 × 109 px（4 cols × 5 rows）
//
//  ┌────────┬───────────────────┬────────┬───────────────────┐
//  │  Row   │  動作              │ frames │  AI Office 狀態    │
//  ├────────┼───────────────────┼────────┼───────────────────┤
//  │  1 (y=   0px) │ 坐著發呆  │   4    │  idle             │
//  │  2 (y=-109px) │ 走路      │   4    │  typing           │
//  │  5 (y=-436px) │ 睡覺      │   4    │  reading          │
//  └────────┴───────────────────┴────────┴───────────────────┘
//
//  檔案放置：assets/kohaku.png
// ─────────────────────────────────────────────────────────────────────────────

export function getWebviewContent(
  webview: vscode.Webview,
  extensionUri: vscode.Uri
): string {
  const nonce = getNonce();

  // VS Code 安全 URI：從 assets/ 資料夾載入圖片
  const spriteUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'assets', 'kohaku.png')
  );

  const csp = [
    `default-src 'none'`,
    `style-src ${webview.cspSource} 'unsafe-inline'`,
    `script-src 'nonce-${nonce}'`,
    `img-src ${webview.cspSource} data:`,
  ].join('; ');

  return /* html */`<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8"/>
  <meta http-equiv="Content-Security-Policy" content="${csp}"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>AI Office</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: var(--vscode-font-family, 'Segoe UI', sans-serif);
      font-size: var(--vscode-font-size, 13px);
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 16px;
      gap: 20px;
      height: 100vh;
      overflow: hidden;
    }

    h1 {
      font-size: 1.3rem;
      font-weight: 600;
      color: var(--vscode-titleBar-activeForeground, #ccc);
      letter-spacing: 0.04em;
      flex-shrink: 0;
    }

    /* ── Sprite Container ──────────────────────────────────────────
     *  顯示尺寸 = 單格原始大小（250 × 109 px）
     *  Pixel art 保持整數倍縮放才不模糊，若要 2× 放大：
     *    width: 500px; height: 218px;
     *    .sprite { background-size: 2000px 1090px; }
     */
    .sprite-container {
      position: relative;
      width:  250px;
      height: 109px;
      border-radius: 12px;
      overflow: hidden;
      background: transparent;
      image-rendering: pixelated;   /* Chrome / Edge */
      image-rendering: crisp-edges; /* Firefox */
      flex-shrink: 0;
    }

    /* ── Sprite Element ────────────────────────────────────────────
     *  background-image  : 透過 webview URI 載入 kohaku.png
     *  background-size   : 整張 sheet 原始大小（1000 × 545 px）
     *                      → 讓每格 px offset 與圖片完全對齊
     *  background-position: 動畫控制 X 軸滑動；Y 軸固定在各 row
     *
     *  steps(4) 讓動畫以「每步跳一格」播放，不做插值
     *  will-change: background-position 提示瀏覽器做 GPU 合成
     */
    .sprite {
      position: absolute;
      inset: 0;
      background-repeat: no-repeat;
      background-image: url('${spriteUri}');
      background-size: 1000px 545px;
      will-change: background-position;
      image-rendering: pixelated;
      image-rendering: crisp-edges;
    }

    /* ── idle（發呆）── Row 1，y = 0px，4 frames，900ms ───────────
     *  X: 0 → -1000px，每步跳 250px（= 1 個 frame 寬度）
     *  duration 900ms / 4 frames = 225ms / frame
     */
    .sprite.idle {
      animation: sprite-idle 0.9s steps(4) infinite;
    }
    @keyframes sprite-idle {
      from { background-position:     0px   0px; }
      to   { background-position: -1000px   0px; }
    }

    /* ── typing（走路忙碌）── Row 2，y = -109px，4 frames，600ms ──
     *  X: 0 → -1000px
     *  duration 600ms / 4 frames = 150ms / frame（輕快節奏）
     */
    .sprite.typing {
      animation: sprite-typing 0.6s steps(4) infinite;
    }
    @keyframes sprite-typing {
      from { background-position:     0px -109px; }
      to   { background-position: -1000px -109px; }
    }

    /* ── reading（睡覺）── Row 5，y = -436px，4 frames，1400ms ────
     *  X: 0 → -1000px
     *  duration 1400ms / 4 frames = 350ms / frame（慵懶呼吸感）
     */
    .sprite.reading {
      animation: sprite-reading 1.4s steps(4) infinite;
    }
    @keyframes sprite-reading {
      from { background-position:     0px -436px; }
      to   { background-position: -1000px -436px; }
    }

    /* ── State Badge ──────────────────────────────────────────────── */
    .state-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 3px 12px;
      border-radius: 20px;
      background: var(--vscode-badge-background, #4d4d4d);
      color: var(--vscode-badge-foreground, #fff);
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      flex-shrink: 0;
      transition: background 0.3s ease;
    }
    .state-badge.idle    { background: #1a5c8a; }
    .state-badge.typing  { background: #1e7e4e; }
    .state-badge.reading { background: #7b4fa6; }

    .state-dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: rgba(255,255,255,0.9);
      animation: pulse 1.4s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1;   transform: scale(1);   }
      50%       { opacity: 0.4; transform: scale(0.7); }
    }

    /* ── Controls ─────────────────────────────────────────────────── */
    .controls {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: center;
      flex-shrink: 0;
    }
    button {
      padding: 5px 12px;
      border: 1px solid var(--vscode-button-border, transparent);
      border-radius: 4px;
      background: var(--vscode-button-secondaryBackground, #3a3d41);
      color: var(--vscode-button-secondaryForeground, #ccc);
      font-size: 0.8rem;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    button:hover  { background: var(--vscode-button-secondaryHoverBackground, #45494e); }
    button.active {
      background: var(--vscode-button-background, #0e639c);
      color: var(--vscode-button-foreground, #fff);
    }

    /* ── Log Feed ─────────────────────────────────────────────────── */
    .log-panel {
      width: 100%;
      max-width: 520px;
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
    }
    .log-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 8px;
      background: var(--vscode-editorGroupHeader-tabsBackground, #2d2d2d);
      border-radius: 6px 6px 0 0;
      font-size: 0.7rem;
      color: var(--vscode-descriptionForeground);
      text-transform: uppercase;
      letter-spacing: 0.07em;
      flex-shrink: 0;
    }
    .log-header button { padding: 1px 7px; font-size: 0.7rem; border-radius: 3px; }
    .log-feed {
      flex: 1;
      overflow-y: auto;
      padding: 8px 10px;
      background: var(--vscode-terminal-background, #1e1e1e);
      border: 1px solid var(--vscode-panel-border, #444);
      border-radius: 0 0 6px 6px;
      font-family: var(--vscode-editor-font-family, monospace);
      font-size: 0.78rem;
      color: var(--vscode-terminal-foreground, #ccc);
      line-height: 1.6;
    }
    .log-entry {
      padding: 1px 0;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      word-break: break-word;
      animation: fadeIn 0.2s ease;
    }
    .log-entry:last-child { border-bottom: none; }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to   { opacity: 1; transform: translateY(0);   }
    }
    .log-time {
      color: var(--vscode-descriptionForeground, #888);
      margin-right: 6px;
      font-size: 0.7rem;
    }
  </style>
</head>
<body>

  <h1>🏢 AI Office <small style="font-size:0.8rem;opacity:0.5">琥珀</small></h1>

  <!-- ── Sprite ── -->
  <div class="sprite-container" title="AI 助手狀態">
    <div class="sprite idle" id="sprite"></div>
  </div>

  <!-- ── State Badge ── -->
  <div class="state-badge idle" id="stateBadge">
    <span class="state-dot"></span>
    <span id="stateText">idle</span>
  </div>

  <!-- ── Controls ── -->
  <div class="controls">
    <button id="btn-idle"    class="active" onclick="setState('idle',true)">😶 發呆</button>
    <button id="btn-typing"  onclick="setState('typing',true)">🐾 忙碌</button>
    <button id="btn-reading" onclick="setState('reading',true)">💤 休息</button>
  </div>

  <!-- ── Log Feed ── -->
  <div class="log-panel">
    <div class="log-header">
      <span>📋 Action Log</span>
      <button onclick="clearLog()">清除</button>
    </div>
    <div class="log-feed" id="logFeed">
      <div class="log-entry">AI Office 初始化完成 — 琥珀已就緒！🐱</div>
    </div>
  </div>

  <script nonce="${nonce}">
    const vscode    = acquireVsCodeApi();
    const STATES    = ['idle', 'typing', 'reading'];
    const sprite    = document.getElementById('sprite');
    const badge     = document.getElementById('stateBadge');
    const stateText = document.getElementById('stateText');
    const logFeed   = document.getElementById('logFeed');

    // ── 狀態切換 ────────────────────────────────────────────────────────────
    function setState(newState, fromUser = false) {
      if (!STATES.includes(newState)) { return; }

      // 強制重啟 animation，讓切換立即從第一格開始
      sprite.style.animation = 'none';
      sprite.classList.remove(...STATES);
      void sprite.offsetWidth;      // force reflow
      sprite.style.animation = '';
      sprite.classList.add(newState);

      // Badge
      badge.classList.remove(...STATES);
      badge.classList.add(newState);
      stateText.textContent = newState;

      // Buttons
      STATES.forEach(s => {
        document.getElementById('btn-' + s)?.classList.toggle('active', s === newState);
      });

      if (fromUser) {
        vscode.postMessage({ command: 'setState', state: newState });
      }
    }

    // ── Log Feed ─────────────────────────────────────────────────────────────
    function appendLog(text) {
      const time  = new Date().toTimeString().slice(0, 8);
      const entry = document.createElement('div');
      entry.className = 'log-entry';
      entry.innerHTML = '<span class="log-time">' + time + '</span>' + escapeHtml(text);
      logFeed.appendChild(entry);
      while (logFeed.children.length > 200) { logFeed.removeChild(logFeed.firstChild); }
      logFeed.scrollTop = logFeed.scrollHeight;
    }

    function clearLog() {
      logFeed.innerHTML = '';
      vscode.postMessage({ command: 'clearOutput' });
    }

    function escapeHtml(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    // ── Extension → Webview ──────────────────────────────────────────────────
    window.addEventListener('message', event => {
      const msg = event.data;
      switch (msg.command) {
        case 'setState':     setState(msg.state, false); break;
        case 'appendOutput': appendLog(msg.text);         break;
        case 'clearOutput':  logFeed.innerHTML = '';      break;
      }
    });

    vscode.postMessage({ command: 'ready' });
    setState('idle', false);
  </script>
</body>
</html>`;
}

// ─── Nonce ────────────────────────────────────────────────────────────────────
function getNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let text = '';
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}
