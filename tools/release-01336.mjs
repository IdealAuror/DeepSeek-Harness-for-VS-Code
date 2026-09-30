// 发布 0.13.36:发送快捷键入口收进设置(移除头部 ⌨️ 按钮)。
import { readFileSync, writeFileSync } from "node:fs";
const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

const PREV = "0.13.35";
const ENTRY_EN = `## 0.13.36
- The send shortcut no longer occupies a header button: the ⌨️ entry was removed from the toolbar and the setting now lives only in **Settings → ⌨️ Sending & input** (General tab), alongside the composer font and the produced-file collapse toggle. The status pill on the composer hint line stays — it shows the active mode (\`Enter 发送\` / \`Ctrl+Enter 发送\` / \`Shift+Enter 发送\`) and still switches on click, so the current binding stays visible without adding another toolbar icon.
- Verified: the header row renders six buttons again (workspaces, jobs, automation tasks, trajectory, settings, subagents), the pill and hint still follow \`dsh.sendKey\`, and all three modes were re-asserted through the jsdom harness.`;

const ENTRY_ZH = `- 发送快捷键不再占用头部按钮:⌨️ 入口已从工具栏移除,设置只保留在**设置 →「⌨️ 发送与输入」**(常规页),与输入区字体、产物文件折叠开关同处一区。输入框提示行旁的胶囊保留 —— 它显示当前模式(\`Enter 发送\` / \`Ctrl+Enter 发送\` / \`Shift+Enter 发送\`)并且仍可点击切换,这样既不占头部图标,又能一眼看到当前键位。
- 已核对:头部恢复为六个按钮(工作区 / 后台任务 / 自动化任务 / 轨迹 / 设置 / 子代理),胶囊与提示行仍跟随 \`dsh.sendKey\`,三种模式已用 jsdom 夹具重新断言通过。`;

const pkgPath = `${root}package.json`;
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const [a, b, c] = pkg.version.split(".").map(Number);
const version = `${a}.${b}.${c + 1}`;
pkg.version = version;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");

let readme = readFileSync(`${root}README.md`, "utf8");
readme = readme.split(`Latest: ${PREV}`).join(`Latest: ${version}`).split(`最新版本:${PREV}`).join(`最新版本:${version}`);
// 上一版把头部按钮写进了 README 说明,这里改回「设置内切换」
readme = readme
  .split("the pill on the hint line under the input box, the ⌨️ header button, or Settings → ⌨️ Sending & input all flip between Enter / Ctrl+Enter / Shift+Enter to send")
  .join("Settings → ⌨️ Sending & input picks Enter / Ctrl+Enter / Shift+Enter to send, and the pill on the hint line under the input box shows the active mode and switches it on click")
  .split("输入框下方提示行的胶囊、头部 ⌨️ 按钮、或 设置 →「⌨️ 发送与输入」都能在 Enter / Ctrl+Enter / Shift+Enter 三种发送键之间切换")
  .join("设置 →「⌨️ 发送与输入」可在 Enter / Ctrl+Enter / Shift+Enter 三种发送键之间切换,输入框下方提示行的胶囊显示当前模式并可点击切换");
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
