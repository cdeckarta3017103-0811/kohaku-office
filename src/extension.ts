import * as vscode from 'vscode';
import { AiOfficePanel } from './panels/AiOfficePanel';

export function activate(context: vscode.ExtensionContext) {
  console.log('[AI Office] Extension activated');

  const openPanel = vscode.commands.registerCommand(
    'ai-office.openPanel',
    () => AiOfficePanel.createOrShow(context.extensionUri)
  );

  context.subscriptions.push(openPanel);
}

export function deactivate() {}
