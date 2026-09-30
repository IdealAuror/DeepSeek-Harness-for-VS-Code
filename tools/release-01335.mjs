// 发布 0.13.35:发送快捷键可在界面内切换(设置面板「发送与输入」+ 输入框胶囊 + 头部菜单)。
import { readFileSync, writeFileSync } from "node:fs";
const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

const PREV = "0.13.34";
const ENTRY_EN = `## 0.13.35
- The send shortcut is now switchable from the UI itself, not only from \`settings.json\`: the hint line under the composer carries a small pill with the current mode (\`Enter to send\` / \`Ctrl+Enter to send\` / \`Shift+Enter to send\`) that switches on click, and a ⌨️ header button opens a menu listing all three modes plus a jump into Settings. Both write \`dsh.sendKey\` globally and take effect in the input box immediately — a reader who is used to Enter-for-newline can move to Ctrl+Enter-to-send in one click and stop sending half-typed messages by accident.
- The Settings panel's General tab gained a \`⌨️ Sending & input\` section above the host namespaces: the three send modes with their exact Enter / Shift+Enter semantics, the composer font (\`dsh.uiFontFamily\`, empty follows the VS Code UI font), and the produced-file list collapse toggle (\`dsh.autoCollapseProducedFiles\`).
- Verified with a jsdom harness that drives the real webview bundle: under \`dsh.sendKey=enter\` only bare Enter sends, under \`ctrl-enter\` only Ctrl+Enter sends, under \`shift-enter\` only Shift+Enter sends — all three modes asserted against all three key combinations, plus the pill text and hint line following the active mode. All new strings are localized in 14 languages.`;

const ENTRY_ZH = `- 发送快捷键现在可以直接在界面里切换,不必只改 \`settings.json\`:输入框下方提示行多了一枚胶囊显示当前模式(\`Enter 发送\` / \`Ctrl+Enter 发送\` / \`Shift+Enter 发送\`),点一下即切换;头部新增 ⌨️ 按钮,菜单里列出三种模式并可直接跳到设置。两处都会全局写入 \`dsh.sendKey\` 并立即在输入框生效 —— 习惯用 Enter 换行的人一次点击就能改成 Ctrl+Enter 发送,不会再手滑把没写完的消息发出去。
- 设置面板常规页新增「⌨️ 发送与输入」分区(排在各宿主命名空间之上):三种发送模式及其 Enter / Shift+Enter 的确切语义、输入区字体(\`dsh.uiFontFamily\`,留空跟随 VS Code 界面字体)、产物文件列表默认折叠开关(\`dsh.autoCollapseProducedFiles\`)。
- 已用 jsdom 夹具驱动真实 webview 包验证:\`dsh.sendKey=enter\` 时只有裸 Enter 发送、\`ctrl-enter\` 时只有 Ctrl+Enter 发送、\`shift-enter\` 时只有 Shift+Enter 发送 —— 三种模式 × 三种按键组合全部断言,并断言胶囊文案与提示行跟随当前模式。所有新文案已补齐 14 种语言。`;

const pkgPath = `${root}package.json`;
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const [a, b, c] = pkg.version.split(".").map(Number);
const version = `${a}.${b}.${c + 1}`;
pkg.version = version;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");

let readme = readFileSync(`${root}README.md`, "utf8");
readme = readme.split(`Latest: ${PREV}`).join(`Latest: ${version}`).split(`最新版本:${PREV}`).join(`最新版本:${version}`);
readme = readme.replace(
  "- Enter to send, Shift+Enter for newline; while running the send button (paper-plane line icon) becomes stop (square line icon), typing turns it back into send (queued send).",
  "- Enter to send, Shift+Enter for newline — and switchable in place: the pill on the hint line under the input box, the ⌨️ header button, or Settings → ⌨️ Sending & input all flip between Enter / Ctrl+Enter / Shift+Enter to send, so an Enter-for-newline habit works too. While running the send button (paper-plane line icon) becomes stop (square line icon), typing turns it back into send (queued send).",
);
readme = readme.replace(
  "- Enter 发送,Shift+Enter 换行;运行中发送按钮(纸飞机线条图标)变为停止(方块线条图标),输入内容即恢复为发送(排队发送)。",
  "- Enter 发送、Shift+Enter 换行,并且可以就地切换:输入框下方提示行的胶囊、头部 ⌨️ 按钮、或 设置 →「⌨️ 发送与输入」都能在 Enter / Ctrl+Enter / Shift+Enter 三种发送键之间切换,习惯用 Enter 换行也照常可用;运行中发送按钮(纸飞机线条图标)变为停止(方块线条图标),输入内容即恢复为发送(排队发送)。",
);
writeFileSync(`${root}README.md`, readme, "utf8");

for (const f of ["CHANGELOG.md", ".dsh/agent/extension-changelog.md"]) {
  const path = `${root}${f}`;
  const s = readFileSync(path, "utf8");
  const marker = f === "CHANGELOG.md" ? "# Changelog\n\n" : "# dsh-vscode Changelog";
  const i = s.indexOf(marker);
  const inserted = i >= 0 ? `${s.slice(0, i + marker.length)}\n${ENTRY_EN.trim()}\n${ENTRY_ZH.trim()}\n\n${s.slice(i + marker.length)}` : `${marker}\n\n${ENTRY_EN.trim()}\n`;
  writeFileSync(path, inserted, "utf8");
  console.log(`${f}: entry added`);
}
console.log(`released v${version}`);
