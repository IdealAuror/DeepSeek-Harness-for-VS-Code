// 发布 0.13.19:修复「生成提交信息」的三处缺陷。
import { readFileSync, writeFileSync } from "node:fs";
const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

const PREV = "0.13.18";
const ENTRY = `## 0.13.19
- Fixed three defects in **Generate Commit Message** (SCM ✨ button) that made it look like the button did nothing and silently changed the model of your other conversations:
- ① **The one-shot session was archived before the prompt**, and DSH 0.1.7 ends a turn on an archived session immediately with \`reason.kind = "blocked"\` — the model was never called, so the command just reported "the model returned no commit message". The session is now created → prompted → archived, and hidden from the session dropdown locally while it works.
- ② \`dsh.commitModel\` defaulted to the literal \`deepseek-v4-flash\`, which does not exist on deployments that ship \`deepseek-flash\` / \`deepseek-v4-pro\`; model selection then failed with \`session/model-unavailable\` and aborted generation. The setting is now a **keyword** (default \`flash\`) matched against the catalog by id or name, with a fallback to the first model that can disable thinking, and generation proceeds with the session's current model when nothing matches.
- ③ \`session/selectModel\` persists the chosen model **and thinking depth** into the profile's \`agent-default-model\` (the default for new sessions), so picking the lightweight commit model rewrote your default — the reason a conversation started showing \`low\` thinking. The original default is now captured before the switch and restored on every exit path (success / cancel / timeout / error).
- Verified against a live 0.1.7-rc.2 server: an archived session really does end the turn with \`blocked\` while an unarchived one completes; switching the commit session to \`flash\` + \`low\` rewrites the profile, and the restore returns it to the previous value; a full generate round-trip (create → archive-free prompt → turn/end → extracted message) now returns a usable Conventional Commits line (\`docs(demo): 更新 demo.txt 示例内容\`).
- Also reinforced for the same 0.1.7 rule: sending a prompt to an **archived** session now auto-unarchives it first through \`workspace/unarchiveSession\` (silently skipped on older hosts), so continuing an archived conversation no longer ends its turn as \`blocked\` and drop the message.`;

const ENTRY_ZH = `- 修复**生成提交信息**(SCM ✨ 按钮)的三处缺陷——它既表现为「点了没反应」,又会悄悄改掉你其它对话的模型:
- ① **一次性会话在发送提示词之前就被归档**,而 DSH 0.1.7 对已归档会话的回合会立刻以 \`reason.kind = "blocked"\` 结束——模型一次都没被调用,命令只报「模型未返回有效提交信息」。现在顺序改为 创建 → 生成 → 归档,生成期间会话在本地隐藏,不出现在会话下拉里。
- ② \`dsh.commitModel\` 默认写死型号 \`deepseek-v4-flash\`,而交付 \`deepseek-flash\` / \`deepseek-v4-pro\` 的部署里并没有这个型号,选型直接以 \`session/model-unavailable\` 失败并中止生成。该设置现改为**关键字**(默认 \`flash\`),按 id 或名称在目录中匹配,匹配不到时回退到第一个可关闭思考的模型,完全匹配不到就用会话当前模型继续生成。
- ③ \`session/selectModel\` 会把所选模型**与思考深度**持久化进 profile 的 \`agent-default-model\`(即新建会话的默认值),因此为提交会话选轻量模型会改写你的默认选择——这就是对话里思考深度变成 \`low\` 的原因。现在会在切换前记录原默认值,并在所有退出路径(成功 / 取消 / 超时 / 出错)上恢复。
- 已在真实 0.1.7-rc.2 服务器上验证:归档会话的回合确实以 \`blocked\` 结束、未归档会话正常完成;把提交会话切到 \`flash\` + \`low\` 确实会改写 profile,恢复调用能把它改回原值;完整链路(创建 → 不归档发送 → turn/end → 提取文本)现在能返回可用的 Conventional Commits 行(\`docs(demo): 更新 demo.txt 示例内容\`)。
- 针对同一条 0.1.7 规则补强:向**已归档会话**发消息前会先经 \`workspace/unarchiveSession\` 自动取消归档(旧宿主无该端点则静默跳过),继续已归档对话不再出现回合被 \`blocked\` 结束、消息被丢弃的情况。`;

const pkgPath = `${root}package.json`;
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const [a, b, c] = pkg.version.split(".").map(Number);
const version = `${a}.${b}.${c + 1}`;
pkg.version = version;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");

let readme = readFileSync(`${root}README.md`, "utf8");
readme = readme.split(`Latest: ${PREV}`).join(`Latest: ${version}`).split(`最新版本:${PREV}`).join(`最新版本:${version}`);

// 英文:提交信息条目补充「临时切换模型并在结束后恢复」
readme = readme.split(
  "with a lightweight model (default `deepseek-v4-flash` + low effort; configurable via `dsh.commitModel` / `dsh.commitReasoningEffort`), writing the result into the SCM input box and auto-cancelling on timeout or when the model requests extra interaction.",
).join(
  "with a lightweight model (default: the `flash` keyword matched against the DSH model catalog + low effort; configurable via `dsh.commitModel` / `dsh.commitReasoningEffort`), writing the result into the SCM input box and auto-cancelling on timeout or when the model requests extra interaction. The model switch is temporary — your default model and thinking depth are captured first and restored when generation ends, and the throwaway session is archived only after the answer arrives (DSH 0.1.7 blocks turns on archived sessions).",
);
readme = readme.split(
  "用轻量模型按 Conventional Commits 风格生成提交信息并写入 SCM 输入框;模型与思考深度可配置(`dsh.commitModel` / `dsh.commitReasoningEffort`),超时或模型请求额外交互时自动取消。",
).join(
  "用轻量模型按 Conventional Commits 风格生成提交信息并写入 SCM 输入框;模型与思考深度可配置(`dsh.commitModel` 为关键字,默认 `flash`,按目录匹配 / `dsh.commitReasoningEffort`),超时或模型请求额外交互时自动取消。模型切换是临时的——先记录你的默认模型与思考深度,生成结束即恢复;一次性会话在拿到结果之后才归档(DSH 0.1.7 对已归档会话会直接 block 回合)。",
);
writeFileSync(`${root}README.md`, readme, "utf8");

for (const f of ["CHANGELOG.md", ".dsh/agent/extension-changelog.md"]) {
  const path = `${root}${f}`;
  const s = readFileSync(path, "utf8");
  const marker = f === "CHANGELOG.md" ? "# Changelog\n\n" : "# dsh-vscode Changelog";
  const i = s.indexOf(marker);
  const inserted = i >= 0 ? `${s.slice(0, i + marker.length)}\n${ENTRY.trim()}\n${ENTRY_ZH.trim()}\n${s.slice(i + marker.length)}` : `${marker}\n\n${ENTRY.trim()}\n`;
  writeFileSync(path, inserted, "utf8");
  console.log(`${f}: entry added`);
}
console.log(`released v${version}`);
