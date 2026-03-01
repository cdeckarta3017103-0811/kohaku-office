import * as vscode from 'vscode';
import { getWebviewContent } from '../webview/webviewContent';

export class AiOfficePanel {
  public static currentPanel: AiOfficePanel | undefined;
  public static readonly viewType = 'aiOffice';

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  // ─── Factory ────────────────────────────────────────────────────────────────

  public static createOrShow(extensionUri: vscode.Uri): void {
    const column = vscode.window.activeTextEditor?.viewColumn;

    // 已有 panel → 直接顯示，不重建
    if (AiOfficePanel.currentPanel) {
      AiOfficePanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      AiOfficePanel.viewType,
      'AI Office',
      column ?? vscode.ViewColumn.One,
      {
        enableScripts: true,

        // ⚠️  圖片路徑關鍵設定
        // localResourceRoots 決定 Webview 被允許讀取哪些本機路徑。
        // 必須同時包含：
        //   1. assets/  → sprite sheet 圖片（kohaku.png）
        //   2. out/     → 編譯後的 JS（未來若有 bundled script 時使用）
        // 缺少任一項，圖片會因 CSP 被擋而顯示空白。
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'assets'),
          vscode.Uri.joinPath(extensionUri, 'out'),
        ],
      }
    );

    AiOfficePanel.currentPanel = new AiOfficePanel(panel, extensionUri);
  }

  // ─── Constructor ────────────────────────────────────────────────────────────

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel        = panel;
    this._extensionUri = extensionUri;

    this._update();

    // Panel 被關閉時清理資源
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Panel 重新顯示時重新渲染（確保 nonce 與 URI 是最新的）
    this._panel.onDidChangeViewState(() => {
      if (this._panel.visible) { this._update(); }
    }, null, this._disposables);

    // 接收來自 Webview 的訊息
    this._panel.webview.onDidReceiveMessage(
      (message: { command: string; state?: string; text?: string }) => {
        switch (message.command) {
          case 'ready':
            // Webview 初始化完成，可在此推送初始狀態
            break;
          case 'setState':
            console.log(`[AI Office] 狀態切換 → ${message.state}`);
            break;
          case 'alert':
            vscode.window.showInformationMessage(message.text ?? '');
            break;
        }
      },
      null,
      this._disposables
    );
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /** 從 Extension Host 控制貓咪動畫狀態 */
  public setSpriteState(state: 'idle' | 'typing' | 'reading'): void {
    this._panel.webview.postMessage({ command: 'setState', state });
  }

  /** 向 Webview 的 Log Feed 串流一行文字 */
  public appendLog(text: string): void {
    this._panel.webview.postMessage({ command: 'appendOutput', text });
  }

  public dispose(): void {
    AiOfficePanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      this._disposables.pop()?.dispose();
    }
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private _update(): void {
    this._panel.title        = 'AI Office';
    this._panel.webview.html = getWebviewContent(
      this._panel.webview,
      this._extensionUri
    );
  }
}
