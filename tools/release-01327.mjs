// 发布 0.13.27:兼容 DSH 0.2.0-rc.2(契约零破坏)+ 接入 0.2.0 异步问答(限时提问)。
import { readFileSync, writeFileSync } from "node:fs";
const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

const PREV = "0.13.26";
const ENTRY_EN = `## 0.13.27
- **Compatible with DSH 0.2.0-rc.2** (the new \`latest\`): the external contract this extension speaks is unchanged between 0.1.7-rc.2 and 0.2.0-rc.2. A mechanical diff of every published package's Typert Remote declarations found **164 → 171 endpoints with zero removals and zero signature changes**, an identical forwarded-host-event allowlist and session-event vocabulary, and the same session format generation; only two projection keys were added (\`userQuestions\`, \`callId\`). Verified live against a real 0.2.0-rc.2 server: 13/13 client checks pass (auth + cookie exchange, \`$events\` ready frame, session list/create, projection baseline, feedback, permission catalog, commands/model catalog/skills, archive) and a full message → tool → response turn completes with \`turn/end {kind:"completed"}\`.
- **Adopted 0.2.0's asynchronous questions**: when a question arrives with timing (\`wait: {callId, timed: true}\`), the card now shows a live countdown pill (\`{n}s 后继续\`) driven by the new \`userQuestions/attachWait\` stream, and the answer is submitted through \`userQuestions/answer\` — so a question that times out no longer blocks the agent, and your late answer is still delivered as a follow-up message. The card switches to "等待已结束 · 可稍后回答" when the wait expires instead of disappearing, plain (untimed) questions are untouched and keep using the 0.1.x \`$events/result\` path, and hosts without the new endpoints fall back silently.
- Model catalog note: 0.2.0 moved the third-party catalog to pi-ai 0.87.1 and dropped some older model IDs. \`dsh.commitModel\` is matched as a keyword against the live catalog (default \`flash\`) and falls back to the session's current model, so no manual reconfiguration is needed here.`;

const ENTRY_ZH = `- **兼容 DSH 0.2.0-rc.2**(新的 \`latest\`):扩展所讲的外部契约在 0.1.7-rc.2 → 0.2.0-rc.2 之间没有变化。对全部已发布包的 Typert Remote 声明做机械比对,结果为 **端点 164 → 171、零移除、零签名变化**,转发主机事件白名单与会话事件词表完全一致,会话格式世代相同;仅新增两个投影键(\`userQuestions\`、\`callId\`)。并在真实 0.2.0-rc.2 服务器上实测:客户端 13/13 项检查通过(认证与 cookie 交换、\`$events\` ready 帧、会话列表/新建、投影基线、反馈、权限目录、命令/模型目录/技能、归档),完整「消息 → 工具 → 回复」回合以 \`turn/end {kind:"completed"}\` 结束。
- **接入 0.2.0 的异步问答**:当提问带有时限描述符(\`wait: {callId, timed: true}\`)时,卡片会显示实时倒计时胶囊(\`{seconds}s 后继续\`,数据来自 0.2.0 新增的 \`userQuestions/attachWait\` 流),作答改走 \`userQuestions/answer\` —— 提问超时不再卡住 Agent,你的迟到回答仍会作为后续消息送达;等待到期后卡片转为「等待已结束 · 可稍后回答」而不是直接消失。无限时的普通提问完全不变,仍走 0.1.x 的 \`$events/result\` 通道;没有这些新端点的旧宿主会静默回退。
- 模型目录提示:0.2.0 把第三方目录升级到 pi-ai 0.87.1 并移除了部分旧型号。\`dsh.commitModel\` 按关键字与实时目录匹配(默认 \`flash\`),匹配不到则回退到会话当前模型,因此这里无需手工重配。`;

const pkgPath = `${root}package.json`;
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const [a, b, c] = pkg.version.split(".").map(Number);
const version = `${a}.${b}.${c + 1}`;
pkg.version = version;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");

let readme = readFileSync(`${root}README.md`, "utf8");
readme = readme.split(`Latest: ${PREV}`).join(`Latest: ${version}`).split(`最新版本:${PREV}`).join(`最新版本:${version}`);
// 英文:提问条目补异步问答说明
readme = readme.split(
  "- **Goals**: progress card + 🎯 chip with edit / complete / clear.",
).join(
  "- **Goals**: progress card + 🎯 chip with edit / complete / clear.\n- **Timed (asynchronous) questions** (DSH 0.2.0+): a question that carries a wait budget shows a live countdown pill on its card; when the wait expires the agent carries on and the card stays answerable (\"wait ended · you can still answer later\"), with the late reply delivered as a follow-up message in the same session.",
);
// 中文
readme = readme.split(
  "- **目标(goal)**:goal 进度卡(目标 · 阶段 · 轮次 · 进度条)+ 🎯 目标模式芯片,点击可 修改 / 完成 / 清除目标。",
).join(
  "- **目标(goal)**:goal 进度卡(目标 · 阶段 · 轮次 · 进度条)+ 🎯 目标模式芯片,点击可 修改 / 完成 / 清除目标。\n- **限时(异步)提问**(DSH 0.2.0+):带等待时限的提问会在卡片上显示实时倒计时胶囊;等待到期后 Agent 先继续工作,卡片保留为「等待已结束 · 可稍后回答」,你的迟到回答会作为同一会话的后续消息送达。",
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
