// 发布 0.13.22:头部工具栏最后两个 emoji 图标改为线条图标(定时任务 / 子代理目录)。
import { readFileSync, writeFileSync } from "node:fs";
const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

const PREV = "0.13.21";
const ENTRY_EN = `## 0.13.22
- The last two emoji in the header toolbar are now line icons that follow the VS Code theme like their neighbours: the **Automation tasks** button (was ⏰) uses a drawn alarm-clock icon (\`ICONS.alarmClock\`) and the **Subagent catalog** button (was 🤖) uses the drawn robot icon, both 15px \`currentColor\` strokes rendered through the same \`lineIcon()\` helper as the workspace / jobs / trajectory / settings buttons. Hover, active, focus-ring and the yellow running state are unchanged, and no coloured glyph is left in the toolbar row (the Cordis plugin button keeps its puzzle emoji because the plugin panel has no drawn counterpart yet).`;

const ENTRY_ZH = `- 头部工具栏最后两个 emoji 改为与相邻按钮一致的线条图标:**自动化任务**(原 ⏰)换成手绘闹钟图标(\`ICONS.alarmClock\`),**子代理目录**(原 🤖)换用手绘机器人图标,两者都是 15px \`currentColor\` 描边,与工作区 / 后台任务 / 轨迹 / 设置按钮走同一个 \`lineIcon()\` 渲染路径。悬停、按下、焦点圈与「有子代理运行中」的黄色状态保持不变,工具栏这一排不再残留彩色字形(Cordis 插件按钮仍保留拼图 emoji,因为插件面板暂无对应线稿)。`;

const pkgPath = `${root}package.json`;
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const [a, b, c] = pkg.version.split(".").map(Number);
const version = `${a}.${b}.${c + 1}`;
pkg.version = version;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");

let readme = readFileSync(`${root}README.md`, "utf8");
readme = readme.split(`Latest: ${PREV}`).join(`Latest: ${version}`).split(`最新版本:${PREV}`).join(`最新版本:${version}`);
// 英文:轨迹视图条目后补一句工具栏图标说明
readme = readme.split(
  "turn-aware event ledger (seq · time · type · summary · token usage), click to expand the full event JSON, type filter.",
).join(
  "turn-aware event ledger (seq · time · type · summary · token usage), click to expand the full event JSON, type filter. The header toolbar is all line icons (workspace / background jobs / automation tasks / trajectory / settings / subagent catalog) drawn at 15px in the theme's icon colour.",
);
// 中文
readme = readme.split(
  "按回合组织的事件台账(序号 / 时间 / 类型 / 摘要 / token 用量),点击展开完整事件 JSON,支持类型筛选。",
).join(
  "按回合组织的事件台账(序号 / 时间 / 类型 / 摘要 / token 用量),点击展开完整事件 JSON,支持类型筛选。头部工具栏统一为线条图标(工作区 / 后台任务 / 自动化任务 / 轨迹 / 设置 / 子代理目录),15px、跟随主题图标色。",
);
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
