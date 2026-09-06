import * as vscode from "vscode";
import type { DshHub } from "../dsh/hub";
import { createTranslator } from "../dsh/i18n";
import { ChatChannel } from "./channel";

const t = createTranslator();

/**
 * 独立聊天窗口:编辑器区(右侧)的单例 WebviewPanel,类似 Claude Code 的 VS Code 插件体验。
 */
export class ChatWindowProvider {
  static readonly viewType = "dsh.chatWindow";

  private panel: vscode.WebviewPanel | undefined;
  private channel: ChatChannel | undefined;
  /** 是否已为一次面板启动失败执行过自动重建(只自动重试一次,避免重启循环) */
  private autoRecovered = false;

  constructor(
    private readonly hub: DshHub,
    private readonly ctx: vscode.ExtensionContext,
    private readonly log?: (line: string) => void,
  ) {}

  /** 打开窗口;已存在时仅聚焦。 */
  open(): vscode.WebviewPanel {
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.Beside, true);
      return this.panel;
    }
    this.panel = vscode.window.createWebviewPanel(
      ChatWindowProvider.viewType,
      "DeepSeek Harness",
      { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(this.ctx.extensionUri, "dist"),
          vscode.Uri.joinPath(this.ctx.extensionUri, "media"),
        ],
      },
    );
    const panel = this.panel;
    panel.iconPath = vscode.Uri.joinPath(this.ctx.extensionUri, "media", "icon.png");
    this.channel = new ChatChannel(this.hub, this.ctx, {
      webview: panel.webview,
      onDidDispose: panel.onDidDispose,
      dispose: () => panel.dispose(),
      log: (line) => this.log?.(line),
      onBootFailed: () => this.recoverAfterBootFailure(),
    });
    panel.onDidDispose(() => {
      // 只清除当前面板的引用:自动重建时旧面板的 onDidDispose 晚于新面板创建到达,
      // 若不带身份判断会把新面板的引用一并清掉。
      if (this.panel === panel) {
        this.panel = undefined;
        this.channel = undefined;
      }
    });
    return panel;
  }

  get isOpen(): boolean {
    return this.panel !== undefined;
  }

  /**
   * 平台 webview 预载失败(Service Worker 注册 InvalidStateError)恢复。
   * 第一次:销毁并重建面板 —— 新 iframe 会让平台预载页重新注册 Service Worker,
   * 此时启动已完成,竞态窗口已关闭,通常一次即可成功。
   * 若再次失败(该 origin 的 Service Worker 状态已损坏):提示用户重载窗口。
   */
  private recoverAfterBootFailure() {
    if (this.autoRecovered) {
      void vscode.window
        .showErrorMessage(t("webview.bootFailed"), t("webview.bootReload"))
        .then((pick) => {
          if (pick === t("webview.bootReload")) void vscode.commands.executeCommand("workbench.action.reloadWindow");
        });
      return;
    }
    this.autoRecovered = true;
    this.log?.(`[boot] 聊天窗口预载失败,自动重建面板(viewType=${ChatWindowProvider.viewType})`);
    const old = this.panel;
    this.panel = undefined;
    this.channel = undefined;
    old?.dispose();
    const panel = this.open();
    panel.reveal(vscode.ViewColumn.Beside, true);
    void vscode.window.showInformationMessage(t("webview.bootRecovered"));
  }
}
