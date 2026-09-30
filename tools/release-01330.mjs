// 发布 0.13.30:采纳 issue #21 的建议(发送快捷键 / 字体 / 自动新建会话 / 记忆会话 / 弹层收起 / 产物占位 / 多行编辑)。
import { readFileSync, writeFileSync } from "node:fs";
const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

const PREV = "0.13.29";
const ENTRY_EN = `## 0.13.30
- Adopted the accepted items from [issue #21](https://github.com/NEXTINDIE/DeepSeek-Harness-for-VS-Code/issues/21):
  - **\`dsh.sendKey\`** (#1): choose whether Enter sends (default), Ctrl+Enter sends, or Shift+Enter sends — the other combination then inserts a newline. The hint line under the composer follows the setting, and the \`@\`-mention / slash popups keep accepting Enter to pick a row.
  - **\`dsh.uiFontFamily\`** (#7): the chat panel now takes any CSS font stack, so Windows users can put \`"Microsoft YaHei UI", "Microsoft YaHei", sans-serif\` first for comfortable Chinese glyphs. Empty (default) keeps following the VS Code UI font; code and diff blocks keep the editor font.
  - **\`dsh.newSessionOnStartup\`** (#5): opening the panel creates an empty session automatically instead of waiting for a click on ＋.
  - **\`dsh.rememberLastSession\`** (#5): each workspace remembers its last session and restores it on the next window, unless that session is archived, gone, or held by another DSH instance.
  - **\`dsh.autoCollapseProducedFiles\`** (#10): the produced-files list starts as one summary line (\`产物 (4)  a.ts · b.ts · c.ts ＋1\`) that expands on click, with an internal scroll area, and deliverable cards are capped in height — a long session no longer gets buried under the previous turn's artifacts.
  - **Popovers always close** (#9): the subagent catalog, goal menu, model menu and subagent preview now close on any outside click, Esc, scroll, or window blur, instead of relying on a single one-shot click handler that could be swallowed.
  - **Queued messages get a real editor** (#11): editing a queued message opens a 6-row, vertically resizable textarea (Enter for newlines, Shift/Ctrl+Enter to confirm, Esc to cancel) instead of a one-line input.
- Already shipped earlier in this line, so nothing further was needed: ↑/↓ input history (#4, 0.13.28), cache-hit/token figures at the bottom instead of only at turn end (#6, 0.13.17). Item #3 (a message lost while the model rejects images) is now covered by the send-failure handling: the composer text is restored and a notice explains the cause, and #2/#8 remain upstream/host-side (image capability comes from the model catalog, not the extension).`;

const ENTRY_ZH = `## 0.13.30
- 采纳 [issue #21](https://github.com/NEXTINDIE/DeepSeek-Harness-for-VS-Code/issues/21) 中可落地的建议:
  - **\`dsh.sendKey\`**(第 1 条):可选 Enter 发送(默认)/ Ctrl+Enter 发送 / Shift+Enter 发送,另一组合键即换行。输入框下方提示行会跟随该设置显示,\`@\` 提及与斜杠命令弹层仍以 Enter 选中当前项。
  - **\`dsh.uiFontFamily\`**(第 7 条):聊天面板支持任意 CSS 字体栈,Windows 用户可把 \`"Microsoft YaHei UI", "Microsoft YaHei", sans-serif\` 放在最前,中文字形更舒服;留空(默认)继续跟随 VS Code 界面字体,代码与 diff 区域仍用编辑器等宽字体。
  - **\`dsh.newSessionOnStartup\`**(第 5 条):打开面板即自动新建一个空会话,不必先点「＋」。
  - **\`dsh.rememberLastSession\`**(第 5 条):按工作区记住上次使用的会话,下次开窗自动恢复;若该会话已归档、已删除或被其他 DSH 实例占用,则自动退回新建。
  - **\`dsh.autoCollapseProducedFiles\`**(第 10 条):产物文件列表默认折叠成一行摘要(\`产物 (4)  a.ts · b.ts · c.ts ＋1\`,点击展开),展开后列表内部滚动;交付卡也限制了高度与宽度 —— 长对话不再被上一轮的产物占满。
  - **弹层一定能收起**(第 9 条):子代理目录、目标菜单、模型菜单、子代理预览改为「点击外部 / Esc / 滚动 / 窗口失焦」任一方式都可关闭,不再依赖可能被吞掉的一次性点击监听。
  - **排队消息可从容编辑**(第 11 条):编辑排队消息改为 6 行、可纵向拖拽的编辑框(Enter 换行,Shift/Ctrl+Enter 确认,Esc 取消),不再是一行输入框。
- 以下条目此前已实现,本次无需改动:↑/↓ 调回历史输入(第 4 条,0.13.28)、缓存命中率与会话 token 固定在底部(第 6 条,0.13.17)。第 3 条(带图片发送后消息丢失)现已由发送失败处理覆盖:失败时保留输入内容并说明原因;第 2、8 条属宿主/上游能力(图片能力由模型目录声明,不由扩展决定)。`;

const pkgPath = `${root}package.json`;
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const [a, b, c] = pkg.version.split(".").map(Number);
const version = `${a}.${b}.${c + 1}`;
pkg.version = version;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");

let readme = readFileSync(`${root}README.md`, "utf8");
readme = readme.split(`Latest: ${PREV}`).join(`Latest: ${version}`).split(`最新版本:${PREV}`).join(`最新版本:${version}`);
readme = readme.split("- Enter to send, Shift+Enter for newline;").join("- The send shortcut is configurable (\`dsh.sendKey\`): Enter (default), Ctrl+Enter or Shift+Enter sends, the other combination inserts a newline. Previously: Enter to send, Shift+Enter for newline;");
readme = readme.split("- 输入框:\`Enter\` 发送,\`Shift+Enter\` 换行;").join("- 发送快捷键可在设置里选择(\`dsh.sendKey\`):Enter(默认)/ Ctrl+Enter / Shift+Enter 发送,另一组合键换行。原行为:\`Enter\` 发送,\`Shift+Enter\` 换行;");
writeFileSync(`${root}README.md`, readme, "utf8");

for (const f of ["CHANGELOG.md", ".dsh/agent/extension-changelog.md"]) {
  const path = `${root}${f}`;
  const s = readFileSync(path, "utf8");
  const marker = f === "CHANGELOG.md" ? "# Changelog\n\n" : "# dsh-vscode Changelog";
  const i = s.indexOf(marker);
  const entry = `${ENTRY_EN.trim()}\n${ENTRY_ZH.trim()}`;
  const inserted = i >= 0 ? `${s.slice(0, i + marker.length)}\n${entry}\n${s.slice(i + marker.length)}` : `${marker}\n\n${entry}\n`;
  writeFileSync(path, inserted, "utf8");
  console.log(`${f}: entry added`);
}
console.log(`released v${version}`);
