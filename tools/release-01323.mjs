// 发布 0.13.23:过程段末尾加「执行了…」汇总行(网页端同款形态),可折叠该段。
import { readFileSync, writeFileSync } from "node:fs";
const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

const PREV = "0.13.22";
const ENTRY_EN = `## 0.13.23
- Every run of consecutive process rows now ends with a **summary row** like the web client's \`Executed commands, read files, modified files, …\`: the icon + a localized action list counted per run (\`1 command\`, \`read 1 file · searched 2 times\`, \`modified 3 files\`, \`fetched 2 pages\`, \`called 1 tool\`) + a chevron. Clicking it collapses or expands that run, the row itself always stays visible, and your choice survives re-renders while the turn streams (it is remembered per run on the assistant message). Runs that only contain thinking get no summary row, so there is no "no tool calls yet" noise; the counts update as each tool result lands.
- Together with 0.13.20–0.13.22 this makes one continuous run read like the web transcript: thinking row → tool row(s) → a summary line for that run, repeated down the turn, all appearing live as the events arrive (measured: tool/call and tool/result arrive in the same tick and the extension renders them immediately, never at turn end).`;

const ENTRY_ZH = `- 每一段连续的过程行末尾现在都有一行**汇总**(与网页端「执行了命令,已读取文件,修改了文件等」同款形态):图标 + 按段统计的本地化动作清单(\`执行了 1 条命令\`、\`读取了 1 个文件、搜索了 2 次\`、\`修改了 3 个文件\`、\`访问了 2 个网页\`、\`调用了 1 个工具\`)+ 折叠箭头。点击即可收起/展开这一段(汇总行自身常显),回合流式进行中重绘也会保留你的开合选择(按段记录在助手消息上);只包含思考的段不显示汇总行,不会出现「暂无工具调用」的噪声;每个工具结果落地时计数即时刷新。
- 与 0.13.20–0.13.22 一起,一条连续执行看起来就和网页端对话一致了:思考行 → 工具行 → 该段汇总行,如此往复,且全部随事件实时出现(已实测:tool/call 与 tool/result 同一节拍到达,扩展当场渲染,不存在「等回合结束才出现」)。`;

const pkgPath = `${root}package.json`;
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const [a, b, c] = pkg.version.split(".").map(Number);
const version = `${a}.${b}.${c + 1}`;
pkg.version = version;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");

let readme = readFileSync(`${root}README.md`, "utf8");
readme = readme.split(`Latest: ${PREV}`).join(`Latest: ${version}`).split(`最新版本:${PREV}`).join(`最新版本:${version}`);
readme = readme.split(
  "rows appear live as each event arrives, and the activity line above the composer names the running action (tool title + summary) rather than a generic label.",
).join(
  "rows appear live as each event arrives, each run of rows ends with a web-style summary line (\`1 command · read 1 file · searched 2 times\`) that folds or unfolds that run when clicked, and the activity line above the composer names the running action (tool title + summary) rather than a generic label.",
);
readme = readme.split(
  "过程行随事件实时出现,输入框上方的活动行同时说明当前动作(工具标题 + 摘要),不再是笼统的「执行工具…」。",
).join(
  "过程行随事件实时出现,每段末尾附一行网页端同款汇总(「执行了 1 条命令 · 读取了 1 个文件 · 搜索了 2 次」),点击即可折叠/展开该段;输入框上方的活动行同时说明当前动作(工具标题 + 摘要),不再是笼统的「执行工具…」。",
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
