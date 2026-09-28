// 发布 0.13.21:回合活动行直接显示当前动作(工具名 + 摘要)。
// 说明:0.13.20 由并行会话发布(提交信息诊断日志),其中不含本次改动,故单独发一版。
import { readFileSync, writeFileSync } from "node:fs";
const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

const PREV = "0.13.20";
const ENTRY_EN = `## 0.13.21
- The turn activity line above the composer now names the running action instead of the generic \`Running a tool…\`: a tool call sets it to the localized tool row title plus its human-readable summary (\`Pwsh · Write-Output hi\`, \`Read · src/app.ts\`, \`Write · lib/git.js\`), and it falls back to \`Thinking deeply…\` / \`Writing the answer…\` as soon as the model streams again. The elapsed timer keeps running, so a long tool call stays identifiable even after the transcript has scrolled away.
- Also documented by measurement (no behaviour change): process rows are created **while the turn runs**, not at turn end. On a real 0.1.7-rc.2 server the \`tool/call\` session event arrives together with its result (+1.02s, +2.26s, …) and the session store forwards it to the webview in the same tick, where the tool node is inserted into the in-progress step group immediately; replaying a captured 8-tool turn through the real webview bundle yields 5 thinking rows, 8 tool rows and 5 prose blocks in true interleaved order, and both the current build and 0.13.17 render them.`;

const ENTRY_ZH = `- 输入框上方的回合活动行不再笼统显示「执行工具…」,而是直接说明当前动作:工具调用时显示本地化的工具行标题 + 人类可读摘要(\`Pwsh · Write-Output hi\`、\`读取 · src/app.ts\`、\`写入 · lib/git.js\`),模型恢复流式输出后回落到「深度思考中…」/「生成回答…」;计时继续走,长时间工具调用即使在对话已滚走的情况下也能一眼确认当前在做什么。
- 另以实测记录(行为未变):过程行是**回合进行中**创建并渲染的,不是回合结束才出现。真实 0.1.7-rc.2 服务器上 \`tool/call\` 会话事件与其结果同时到达(+1.02s、+2.26s……),会话存储在同一个事件节拍内转发给 webview,工具节点当场插入正在进行的步骤分组;把抓取到的 8 次工具调用回合喂给真实 webview 包回放,得到 5 条思考行、8 条工具行、5 段正文按真实顺序交错,当前构建与 0.13.17 均如此渲染。`;

const pkgPath = `${root}package.json`;
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const [a, b, c] = pkg.version.split(".").map(Number);
const version = `${a}.${b}.${c + 1}`;
pkg.version = version;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");

let readme = readFileSync(`${root}README.md`, "utf8");
readme = readme.split(`Latest: ${PREV}`).join(`Latest: ${version}`).split(`最新版本:${PREV}`).join(`最新版本:${version}`);
readme = readme.split(
  "with a status dot, a running sweep animation, and the full arguments/result (plus image results) behind a click.",
).join(
  "with a status dot, a running sweep animation, and the full arguments/result (plus image results) behind a click; rows appear live as each event arrives, and the activity line above the composer names the running action (tool title + summary) rather than a generic label.",
);
readme = readme.split(
  "点击展开完整参数/结果(含图片结果);不再把整段 JSON 铺在行上。",
).join(
  "点击展开完整参数/结果(含图片结果);不再把整段 JSON 铺在行上。过程行随事件实时出现,输入框上方的活动行同时说明当前动作(工具标题 + 摘要),不再是笼统的「执行工具…」。",
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
