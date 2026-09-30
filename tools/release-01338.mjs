// 发布 0.13.38:底部统计胶囊不再互相覆盖,且回合进行中即可见。
import { readFileSync, writeFileSync } from "node:fs";
const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

const PREV = "0.13.37";
const ENTRY_EN = `## 0.13.38
- **Fixed the bottom stat pills collapsing to one, and only showing up after switching sessions.** The host pushes \`sessionStats\` and \`tokenUsage\` as two separate \`stats\` messages, each carrying exactly one key; the webview assigned the whole object (\`state.stats = msg.value\`), so whichever arrived last erased the other — the familiar symptom is a lone \`2 turns 101 steps\` pill with no token pill until a session switch re-sent the merged snapshot. The handler now merges per field, so both projections survive in either arrival order.
- The pills no longer depend on the projection arriving at all: the derived path (from session events) now also accumulates token usage from each \`assistant/message\`'s \`usage\`, and the row refreshes when an assistant message or tool result lands — so the row becomes visible **during** a turn instead of only at \`turn/end\`.
- Regression test kept in the repo: \`tools/test-stats-merge.mjs\` (7 checks — both arrival orders, init snapshot, each projection alone, foreign-session ignore, and the derived-only path with no projection), driven through the real webview bundle in jsdom.`;

const ENTRY_ZH = `- **修复底部统计胶囊只剩一枚、且只有切换会话后才出现**。宿主把 \`sessionStats\` 与 \`tokenUsage\` 分成两条 \`stats\` 消息推送,每条只带一个键;webview 却是整对象赋值(\`state.stats = msg.value\`),于是后到的那条把先到的抹掉 —— 典型表现就是只剩一枚「2 轮 101 步」,看不到 token 胶囊,直到切换会话重推合并快照才恢复。现在改为按字段合并,两种到达顺序下两条投影都保留。
- 胶囊不再依赖投影到达:派生路径(由会话事件推导)现在也会累加每条 \`assistant/message\` 自带的 \`usage\`,并在助手消息或工具结果落地时刷新统计行 —— 因此**回合进行中**就能看到,而不必等 \`turn/end\`。
- 回归测试留在仓库里:\`tools/test-stats-merge.mjs\`(7 项 —— 两种到达顺序、init 快照、各自单独出现、忽略其它会话、完全无投影的派生路径),全部用真实 webview 包在 jsdom 中驱动。`;

const pkgPath = `${root}package.json`;
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const [a, b, c] = pkg.version.split(".").map(Number);
const version = `${a}.${b}.${c + 1}`;
pkg.version = version;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");

let readme = readFileSync(`${root}README.md`, "utf8");
readme = readme.split(`Latest: ${PREV}`).join(`Latest: ${version}`).split(`最新版本:${PREV}`).join(`最新版本:${version}`);
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
