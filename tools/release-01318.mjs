// 发布 0.13.18:适配 DSH 0.1.7-rc.2(自动化任务面板、逐消息反馈、端点下线兜底)。
import { readFileSync, writeFileSync } from "node:fs";
const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

const PREV = "0.13.17";
const ENTRY_EN = `## 0.13.18
- Adapt to DSH 0.1.7-rc.2: new **Automation tasks panel** (⏰ button) listing every host-side reminder (task title, rule text, next scheduled time with countdown, enabled/ended status) with search + status filter, a per-task detail (instruction, frequency, time zone, linked session jump, last delivery) and its **delivery records** (newest-first, \`Load more\` paging) plus delete with inline confirmation — refreshed automatically from the host's \`schedule/changed\` invalidation event; the host's schedule feature is off by default since 0.1.7, and the panel explains that instead of failing.
- **Native per-message feedback**: 👍/👎 on assistant messages now write through \`messageFeedback/put\` (versioned CAS against the host) instead of the \`/feedback\` command, so clicking the active rating revokes it and ratings survive reloads (they are read back from \`messageFeedback/list\`); older sessions without a message id still fall back to the command.
- **0.1.7 endpoint removals handled**: \`subagents/list\` was removed, so the subagent catalog is now folded from the \`subagentCatalog\` session projection (with per-child running state) and refreshed live; the removed preset-authoring endpoints (copy / delete / open preset folder) are probed through \`settings/canOpenAgentPresetDirectory\` and their buttons only appear on hosts that still serve them, with a clear notice otherwise.
- **Projection baseline on session open** (\`session/projections\`): statistics, to-dos, permissions, context meter and the subagent catalog are read from the host right after a session opens instead of waiting for the next projection frame.
- Verified against the published 0.1.5-rc.1 and 0.1.7-rc.2 package sets: the request envelope, \`remote.mux\` stream set (\`session/follow\`, \`session/control\`, \`workspace/follow\`, \`$events\` + \`$events/result\`), host-event vocabulary, and every endpoint this extension calls except the three removals above are unchanged (one signature change: \`workspaceFiles/readBytes\`, unused here).
- Fixed while verifying against a live 0.1.7-rc.2 server: \`session/projections\` needs its single-argument payload wrapped as \`{request:{…}}\` (it previously failed descriptor validation and silently fell back), and a gateway 404 for a removed/disabled endpoint now surfaces as a typed \`method-unavailable\` error instead of a bare transport failure — the automation-tasks panel uses that to explain a host with the schedule plugin disabled instead of showing an error. 13/13 live checks pass (auth + cookie exchange, \`$events\` ready frame, session list/create, projection baseline, feedback list, permission catalog, schedule unavailable path, preset-authoring probe, commands/model catalog/skills, archive).`;

const ENTRY_ZH = `- 适配 DSH 0.1.7-rc.2:新增**自动化任务面板**(⏰ 按钮),列出宿主侧全部提醒任务(任务名 · 规则文案 · 下次计划时间与倒计时 · 已开启/已结束),支持搜索与状态筛选、任务详情(内容 · 提醒频率 · 时区 · 关联会话跳转 · 最近一次投递)与其**运行记录**(新→旧分页,「加载更多」)以及就地确认的删除;目录随宿主 \`schedule/changed\` 失效事件自动刷新。宿主自 0.1.7 起默认关闭定时任务,面板会明确说明而不是报错。
- **原生逐消息反馈**:助手消息的 👍/👎 改用 \`messageFeedback/put\`(带 version 的 CAS 写入)而非 \`/feedback\` 命令——再次点击当前评价即可撤销,评价在重载后依然显示(由 \`messageFeedback/list\` 读回);没有 message id 的旧会话仍回退到命令通道。
- **0.1.7 端点下线兜底**:\`subagents/list\` 已移除,子代理目录改为从 \`subagentCatalog\` 会话投影折叠(含每个子代理的运行态)并实时刷新;已移除的预设作者端点(复制 / 删除 / 打开预设目录)改为经 \`settings/canOpenAgentPresetDirectory\` 探测能力,只在仍提供这些端点的宿主上显示按钮,否则给出明确提示。
- **会话打开即读投影基线**(\`session/projections\`):统计、待办、权限、上下文进度环与子代理目录在会话打开后立刻从宿主读取,不再等下一个投影帧。
- 已按已发布的 0.1.5-rc.1 与 0.1.7-rc.2 包逐一核对:请求信封、\`remote.mux\` 流派(\`session/follow\` / \`session/control\` / \`workspace/follow\` / \`$events\` + \`$events/result\`)、主机事件词表,以及本扩展调用的全部端点(上述三处移除除外)均未变化;唯一签名变化 \`workspaceFiles/readBytes\` 本扩展未使用。
- 对真实 0.1.7-rc.2 服务器验证时修复两处:① \`session/projections\` 的单参数载荷必须包一层 \`{request:{…}}\`(此前被描述符校验拒绝并静默回退);② 端点被移除/未启用时的网关 404 现在转成带 \`method-unavailable\` 错误码的 \`DshApiError\`,而不是裸传输失败——自动化任务面板据此判断「宿主未启用定时任务」并给出说明,而不是报错。13/13 项实测通过(认证与 cookie 交换、\`$events\` ready 帧、会话列表/新建、投影基线、反馈列表、权限目录、定时任务不可用路径、预设作者探测、命令/模型目录/技能、归档)。`;

const ENTRY = `${ENTRY_EN}\n${ENTRY_ZH}`;

const pkgPath = `${root}package.json`;
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const [a, b, c] = pkg.version.split(".").map(Number);
const version = `${a}.${b}.${c + 1}`;
pkg.version = version;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");

// README 版本号(英文/中文两处 Latest)+ 功能条目
let readme = readFileSync(`${root}README.md`, "utf8");
readme = readme.split(`Latest: ${PREV}`).join(`Latest: ${version}`).split(`最新版本:${PREV}`).join(`最新版本:${version}`);

// 英文:反馈条目改写 + 后台任务面板后补自动化任务面板
readme = readme.split(
  "/ thumbs up/down (line icons, official `/feedback`) / message header shows model",
).join(
  "/ thumbs up/down (line icons; native `messageFeedback` with click-again-to-revoke, `/feedback` command fallback for older sessions) / message header shows model",
);
readme = readme.split(
  "- **Background jobs panel** (⚙️ button): bash / pwsh / subagent jobs for the current session with status, timings, and detail, live from session/jobs frames.",
).join(
  "- **Background jobs panel** (⚙️ button): bash / pwsh / subagent jobs for the current session with status, timings, and detail, live from session/jobs frames.\n" +
    "- **Automation tasks panel** (⏰ button, host-side `schedule/*`, DSH 0.1.7+): every retained reminder with its rule text, next scheduled time and countdown, enabled / ended status, search and status filter; open a task for its instruction, frequency, time zone, linked session (jump straight to it), last delivery and its **delivery records** (newest-first with paging) and delete it after an inline confirmation. The catalog refreshes itself from the host's `schedule/changed` event; when the host has the schedule plugin disabled (the 0.1.7 default) the panel says so instead of erroring.",
);
readme = readme.split(
  "agent preset authoring (view composition / copy / open directory to edit cordis.yml / delete user presets).",
).join(
  "agent preset authoring on hosts that still expose it — DSH 0.1.7 removed the preset authoring endpoints, so the copy / open-directory / delete buttons only appear when `settings/canOpenAgentPresetDirectory` reports support and presets are otherwise read-only composition text.",
);

// 中文:反馈条目改写 + 后台任务面板后补自动化任务面板
readme = readme.split(
  "/ 点赞、点踩(拇指线条图标,官方 `/feedback` 记录)/ 消息头显示模型名",
).join(
  "/ 点赞、点踩(拇指线条图标;0.1.7 起走原生 `messageFeedback`,再点一次即撤销,旧会话回退到 `/feedback` 命令)/ 消息头显示模型名",
);
readme = readme.split(
  "- **后台任务面板**(⚙️ 按钮):当前会话的 bash / pwsh / 子代理等后台任务清单(状态 · 起止时间 · 耗时 · 明细),随 session/jobs 帧实时刷新。",
).join(
  "- **后台任务面板**(⚙️ 按钮):当前会话的 bash / pwsh / 子代理等后台任务清单(状态 · 起止时间 · 耗时 · 明细),随 session/jobs 帧实时刷新。\n" +
    "- **自动化任务面板**(⏰ 按钮,宿主侧 `schedule/*`,需 DSH 0.1.7+):列出全部保留的提醒任务(规则文案 · 下次计划时间与倒计时 · 已开启/已结束),支持搜索与状态筛选;点开任务可看内容、提醒频率、时区、关联会话(一键跳转)、最近一次投递与其**运行记录**(新→旧分页),并可就地确认删除。目录随宿主 `schedule/changed` 事件自动刷新;宿主未启用定时任务插件(0.1.7 默认)时面板给出说明而不是报错。",
);
readme = readme.split(
  "Agent 预设管理(查看组合文本 / 复制新预设 / 打开预设目录编辑 cordis.yml / 删除用户预设)。",
).join(
  "Agent 预设管理(在仍提供作者端点的宿主上可 查看组合文本 / 复制新预设 / 打开预设目录编辑 cordis.yml / 删除用户预设——DSH 0.1.7 移除了预设作者端点,此时按钮隐藏,预设只能查看组合文本)。",
);
writeFileSync(`${root}README.md`, readme, "utf8");

for (const f of ["CHANGELOG.md", ".dsh/agent/extension-changelog.md"]) {
  const path = `${root}${f}`;
  const s = readFileSync(path, "utf8");
  const marker = f === "CHANGELOG.md" ? "# Changelog\n\n" : "# dsh-vscode Changelog";
  const i = s.indexOf(marker);
  const inserted = i >= 0 ? `${s.slice(0, i + marker.length)}\n${ENTRY.trim()}\n${s.slice(i + marker.length)}` : `${marker}\n\n${ENTRY.trim()}\n`;
  writeFileSync(path, inserted, "utf8");
  console.log(`${f}: entry added`);
}
console.log(`released v${version}`);
