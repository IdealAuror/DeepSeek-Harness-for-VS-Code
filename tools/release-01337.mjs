// 发布 0.13.37:修复压缩行永久停在「正在压缩上下文…」。
import { readFileSync, writeFileSync } from "node:fs";
const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

const PREV = "0.13.36";
const ENTRY_EN = `## 0.13.37
- **Fixed the conversation ending with a permanent "Compacting context…" row** (the running compaction line that survived an already-finished turn). Root cause, measured on a live 0.2.0-rc.2 server: the host changed the compaction checkpoint marker — a finished compaction now writes its checkpoint as \`user/message\` with \`source = {kind:"compact-checkpoint", compactionId, sourceCommandId?}\`, while the extension still recognized the old \`{kind:"plugin", plugin:"compact"}\` shape. \`MessageSourceMap\` explicitly documents that there is no shared catch-all \`plugin\` kind any more, so the check matched nothing, the row was never marked done, and it kept its running sweep at the tail of the transcript.
- The checkpoint check now accepts both markers, and two independent fallbacks make the row impossible to strand: \`compaction/end\` closes a successfully compacted row (previously it only handled the error case), and a turn boundary closes any auto-compaction row still marked running.
- Verified two ways. ① Live capture: a real \`/compact\` run produced \`compaction/start\` → \`compaction/summary\` → \`user/message\` checkpoint with exactly \`{"kind":"compact-checkpoint",…}\` → \`compaction/end\`, and a failed compaction produced \`compaction/end\` with \`error\`. ② Replay through the real webview bundle: the pre-fix code renders \`data-state=running\` with \`正在压缩上下文…\` for that exact sequence (bug reproduced), the fixed code lands on \`data-state=done\`; both checkpoint markers pass, a missing checkpoint is recovered by \`compaction/end\`, a failed compaction still lands on \`error\`, and auto-compaction (no \`sourceCommandId\`) plus a turn-boundary fallback both converge to done.`;

const ENTRY_ZH = `- **修复对话结束后仍在最底部留一条「正在压缩上下文…」**。根因(在真实 0.2.0-rc.2 服务器上实测):宿主改了压缩检查点的来源标记 —— 压缩完成时写入的 \`user/message\` 现在带 \`source = {kind:"compact-checkpoint", compactionId, sourceCommandId?}\`,而扩展仍在按旧的 \`{kind:"plugin", plugin:"compact"}\` 匹配。\`MessageSourceMap\` 已明确不再有共享的 \`plugin\` 兜底类型,于是判定全部落空:压缩行永远不会被标成完成,尾部就一直挂着运行中的扫光。
- 检查点判定现在同时接受新旧两种标记,并加了两道独立兜底,使这一行不可能再卡住:① \`compaction/end\` 在**成功**时也收尾(此前只处理失败分支);② 回合边界会把任何仍标着「运行中」的自动压缩行收敛为完成。
- 两路验证:① 实拍 —— 真实 \`/compact\` 产生 \`compaction/start\` → \`compaction/summary\` → 带 \`{"kind":"compact-checkpoint",…}\` 的 \`user/message\` 检查点 → \`compaction/end\`;压缩失败时 \`compaction/end\` 带 \`error\`。② 用真实 webview 包回放:修复前的代码对该序列渲染出 \`data-state=running\` +「正在压缩上下文…」(缺陷复现),修复后落到 \`data-state=done\`;新旧两种标记都通过、缺检查点时由 \`compaction/end\` 收尾、失败仍落到 \`error\`、自动压缩(无 \`sourceCommandId\`)与回合边界兜底都收敛为完成。`;

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
