/**
 * 压缩上下文命令行(网页端 CompactionItem 同款)回归测试:
 * 用 jsdom 加载构建产物 dist/webview/ui.js,喂入真实的 0.1.5-rc.1 事件序列
 * (command/run → compaction/start → compaction/summary → 检查点 user/message → compaction/end → command/done),
 * 断言:运行中行 → 完成行的状态与文案、检查点不再渲染成「系统提示词」卡片、
 * surface replace 保留历史条目(surface 只重写模型上下文,不删对话记录)、点击展开摘要正文、
 * 旧服务器(无 compaction 事件)回退到命令结果文本。
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

/**
 * jsdom 只在临时脚手架目录安装(不进本仓库依赖):先按包名解析,
 * 失败则回退到 $env:TEMP\dsh-webview-test(或 DSH_JSDOM_ENTRY 指定的入口)。
 */
async function loadJsdom() {
  try {
    return await import("jsdom");
  } catch {}
  const candidates = [
    process.env.DSH_JSDOM_ENTRY,
    process.env.TEMP ? path.join(process.env.TEMP, "dsh-webview-test", "node_modules", "jsdom", "lib", "api.js") : undefined,
  ].filter((value) => typeof value === "string" && value !== "");
  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue;
    const mod = await import(pathToFileURL(candidate).href);
    return mod.JSDOM ? mod : mod.default;
  }
  throw new Error("未找到 jsdom:请在临时目录安装,或用 DSH_JSDOM_ENTRY 指向 jsdom 入口");
}

const { JSDOM } = await loadJsdom();
const bundle = fs.readFileSync(process.env.DSH_BUNDLE ?? "dist/webview/ui.js", "utf8");

function boot({ lang = "zh-cn" } = {}) {
  const dom = new JSDOM("<!DOCTYPE html><html><body><div id=\"app\"></div></body></html>", {
    runScripts: "outside-only",
    pretendToBeVisual: true,
    url: "https://localhost/",
  });
  const { window } = dom;
  const sent = [];
  window.acquireVsCodeApi = () => ({
    postMessage: (m) => sent.push(m),
    getState: () => undefined,
    setState: () => undefined,
  });
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  window.requestAnimationFrame = (fn) => setTimeout(() => fn(Date.now()), 0);
  window.cancelAnimationFrame = (id) => clearTimeout(id);
  window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
  window.eval(bundle);
  // 线上事件以 WireEvent({event, view}) 信封下发:裸事件在这里自动补信封。
  // 直接派发 message 事件(而不是 window.postMessage),让消息同步送达界面,
  // 断言无需等待宏任务。
  const post = (msg) => {
    const next = msg && Array.isArray(msg.events) ? { ...msg, events: msg.events.map((e) => (e && e.event ? e : { event: e })) } : msg;
    const event = new window.MessageEvent("message", { data: next });
    window.dispatchEvent(event);
  };
  post({
    kind: "init",
    sessions: [{ sessionId: "s1", updatedAt: Date.now(), running: false, blank: false, title: "test" }],
    current: "s1",
    running: false,
    hasMore: false,
    events: [],
    lang,
    languagePref: lang,
  });
  return { window, document: window.document, sent, post };
}

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail && !ok ? ` — ${detail}` : ""}`);
}

const seq = (n) => ({ seq: n, time: 1_700_000_000_000 + n });
const summarizable = (text) => [{ type: "text", text }];
/** 线上事件以 WireEvent({event, view}) 信封传给界面(与 channel.serializeEvent 一致)。 */
const wire = (event) => ({ event });

// ---------- 1. 手动 /compact 的完整生命周期 ----------
{
  const { window, document, post } = boot();
  const events = [
    { ...seq(10), type: "user/message", data: { content: [{ type: "text", text: "第一条消息" }], source: { kind: "user" } } },
    { ...seq(11), type: "assistant/message", data: { turn: 1, step: 1, message: { content: [{ type: "text", text: "回答" }], source: { provider: "deepseek", model: "m" } } } },
    { ...seq(20), type: "command/run", data: { commandId: "cmd-1", name: "compact", args: "", source: { kind: "user" } } },
  ];
  for (const e of events) post({ kind: "delta", events: [wire(e)] });

  let rows = document.querySelectorAll(".cmd-row");
  check("command/run 立即渲染压缩行", rows.length === 1, `rows=${rows.length}`);
  check("运行中状态 running", rows[0]?.dataset.state === "running", rows[0]?.dataset.state);
  check("运行中摘要为「正在压缩上下文…」", rows[0]?.querySelector(".cmd-summary")?.textContent === "正在压缩上下文…", rows[0]?.querySelector(".cmd-summary")?.textContent);
  check("行标题为命令名 compact", rows[0]?.querySelector(".cmd-title")?.textContent === "compact", rows[0]?.querySelector(".cmd-title")?.textContent);
  check("运行中不可展开", rows[0]?.dataset.expandable === "false", rows[0]?.dataset.expandable);

  post({ kind: "delta", events: [
      { ...seq(21), type: "compaction/start", data: { compactionId: "cp-1", sourceCommandId: "cmd-1", turn: null } },
      {
        ...seq(22),
        type: "compaction/summary",
        data: {
          compactionId: "cp-1",
          sourceCommandId: "cmd-1",
          summary: summarizable("## 摘要标题\n- 要点一"),
          shadowedSeqs: [1, 2, 3, 10, 11],
          shadowedTokenCount: 490658,
          shadowedRange: { start: 10, end: 11 },
        },
      },
    ],
  });
  rows = document.querySelectorAll(".cmd-row");
  check("compaction/* 不新增行(与命令 id 合并)", rows.length === 1, `rows=${rows.length}`);
  check("摘要到达后仍为 running(等待检查点)", rows[0]?.dataset.state === "running", rows[0]?.dataset.state);

  // 检查点:surfaceOp replace 覆盖 [10, 11] —— 只是把这段从**模型上下文**里换成摘要,
  // 对话记录必须原样保留(网页端同款:被压缩的消息仍能往上翻到)
  post({ kind: "delta", events: [
      {
        ...seq(23),
        type: "user/message",
        surfaceOp: { op: "replace", startSeq: 10, endSeq: 11 },
        sourceEventSeqs: [21, 22, 10, 11],
        data: {
          content: [{ type: "text", text: "This is an automatically generated checkpoint\n\n<compacted-summary>\n## 摘要标题\n</compacted-summary>" }],
          source: { kind: "plugin", plugin: "compact", compactionId: "cp-1", sourceCommandId: "cmd-1" },
          role: "user",
        },
      },
    ],
  });
  rows = document.querySelectorAll(".cmd-row");
  check("检查点后行完成 done", rows[0]?.dataset.state === "done", rows[0]?.dataset.state);
  check(
    "完成摘要显示条数与 token(网页端同款)",
    rows[0]?.querySelector(".cmd-summary")?.textContent === "已压缩 5 条历史记录(约 490658 tokens)",
    rows[0]?.querySelector(".cmd-summary")?.textContent,
  );
  check("检查点不再渲染为系统提示词卡片", document.querySelectorAll(".system-note").length === 0, `notes=${document.querySelectorAll(".system-note").length}`);
  check("压缩前的问题仍在对话里(不被删除)", document.querySelectorAll(".msg-user").length === 1, `users=${document.querySelectorAll(".msg-user").length}`);
  check("压缩前的回答仍在对话里(不被删除)", document.querySelectorAll(".msg-assistant").length === 1, `assistant=${document.querySelectorAll(".msg-assistant").length}`);
  check("被压缩区间的消息文本仍可读", document.body.textContent.includes("第一条消息"), "文本缺失");
  check("压缩行本身保留(锚点在区间之外)", rows.length === 1, `rows=${rows.length}`);
  check("摘要可展开", rows[0]?.dataset.expandable === "true", rows[0]?.dataset.expandable);

  rows[0].querySelector(".cmd-row-btn").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  const body = rows[0].querySelector(".cmd-body");
  check("点击展开摘要正文", body?.hidden === false && rows[0]?.dataset.expanded === "true", `hidden=${body?.hidden}`);
  check("摘要正文按 Markdown 渲染", body?.querySelector("h2")?.textContent === "摘要标题", body?.innerHTML?.slice(0, 60));
  rows[0].querySelector(".cmd-row-btn").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  check("再次点击收起", rows[0].querySelector(".cmd-body")?.hidden === true, String(rows[0].querySelector(".cmd-body")?.hidden));

  post({ kind: "delta", events: [{ ...seq(24), type: "compaction/end", data: { compactionId: "cp-1", sourceCommandId: "cmd-1", turn: null } }] });
  post({ kind: "delta", events: [{ ...seq(25), type: "command/done", data: { commandId: "cmd-1", kind: "success", text: "Compacted 5 history items (~490658 tokens).", sourceEventSeq: 22 } }] });
  rows = document.querySelectorAll(".cmd-row");
  check("command/done 不重复渲染行", rows.length === 1, `rows=${rows.length}`);
  check("结果文本不覆盖条数摘要", rows[0]?.querySelector(".cmd-summary")?.textContent === "已压缩 5 条历史记录(约 490658 tokens)", rows[0]?.querySelector(".cmd-summary")?.textContent);
}

// ---------- 2. 旧服务器(无 compaction 事件):回退到命令结果 ----------
{
  const { document, post } = boot();
  post({ kind: "delta", events: [{ ...seq(30), type: "command/run", data: { commandId: "cmd-2", name: "compact", args: "" } }] });
  post({ kind: "delta", events: [{ ...seq(31), type: "command/done", data: { commandId: "cmd-2", kind: "success", text: "Compacted 12 history items (~3400 tokens)." } }] });
  const row = document.querySelector(".cmd-row");
  check("无压缩事件时回退到命令结果文本", row?.querySelector(".cmd-summary")?.textContent === "Compacted 12 history items (~3400 tokens).", row?.querySelector(".cmd-summary")?.textContent);
  check("回退态为 done", row?.dataset.state === "done", row?.dataset.state);
}

// ---------- 3. 压缩被拒(会话忙):错误态 ----------
{
  const { document, post } = boot();
  post({ kind: "delta", events: [{ ...seq(40), type: "command/run", data: { commandId: "cmd-3", name: "compact", args: "" } }] });
  post({ kind: "delta", events: [
      {
        ...seq(41),
        type: "command/done",
        data: { commandId: "cmd-3", kind: "error", text: "Compaction is unavailable because this process has an active compaction, or the agent is not idle." },
      },
    ],
  });
  const row = document.querySelector(".cmd-row");
  check("失败态 data-state=error", row?.dataset.state === "error", row?.dataset.state);
  check("失败摘要为宿主错误文本", row?.querySelector(".cmd-summary")?.textContent?.startsWith("Compaction is unavailable"), row?.querySelector(".cmd-summary")?.textContent);
}

// ---------- 4. 自动压缩(无来源命令):独立行 + 「上下文已压缩」标题 ----------
{
  const { document, post } = boot();
  post({ kind: "delta", events: [
      { ...seq(50), type: "compaction/start", data: { compactionId: "cp-9", turn: 3 } },
      { ...seq(51), type: "compaction/summary", data: { compactionId: "cp-9", summary: summarizable("auto"), shadowedSeqs: [1, 2], shadowedTokenCount: 1200 } },
      {
        ...seq(52),
        type: "user/message",
        surfaceOp: { op: "replace", startSeq: 1, endSeq: 48 },
        data: { content: [{ type: "text", text: "checkpoint" }], source: { kind: "plugin", plugin: "compact", compactionId: "cp-9" } },
      },
      { ...seq(53), type: "compaction/end", data: { compactionId: "cp-9", turn: 3 } },
    ],
  });
  const row = document.querySelector(".cmd-row");
  check("自动压缩渲染独立行", document.querySelectorAll(".cmd-row").length === 1);
  check("自动压缩标题为「上下文已压缩」", row?.querySelector(".cmd-title")?.textContent === "上下文已压缩", row?.querySelector(".cmd-title")?.textContent);
  check("自动压缩摘要显示条数", row?.querySelector(".cmd-summary")?.textContent === "已压缩 2 条历史记录(约 1200 tokens)", row?.querySelector(".cmd-summary")?.textContent);
}

// ---------- 5. 重新载入(历史重放):命令行走 init 通道同样重建 ----------
{
  const { document, post } = boot();
  post({
    kind: "init",
    sessions: [{ sessionId: "s1", updatedAt: Date.now(), running: false, blank: false }],
    current: "s1",
    running: false,
    hasMore: false,
    lang: "zh-cn",
    languagePref: "zh-cn",
    events: [
      { ...seq(60), type: "user/message", data: { content: [{ type: "text", text: "旧消息" }], source: { kind: "user" } } },
      { ...seq(61), type: "command/run", data: { commandId: "cmd-4", name: "compact", args: "" } },
      { ...seq(62), type: "compaction/start", data: { compactionId: "cp-4", sourceCommandId: "cmd-4", turn: null } },
      { ...seq(63), type: "compaction/summary", data: { compactionId: "cp-4", sourceCommandId: "cmd-4", summary: summarizable("摘要"), shadowedSeqs: [1, 2, 3], shadowedTokenCount: 999 } },
      {
        ...seq(64),
        type: "user/message",
        surfaceOp: { op: "replace", startSeq: 60, endSeq: 60 },
        data: { content: [{ type: "text", text: "checkpoint" }], source: { kind: "plugin", plugin: "compact", compactionId: "cp-4", sourceCommandId: "cmd-4" } },
      },
      { ...seq(65), type: "compaction/end", data: { compactionId: "cp-4", sourceCommandId: "cmd-4", turn: null } },
      { ...seq(66), type: "command/done", data: { commandId: "cmd-4", kind: "success", text: "Compacted 3 history items (~999 tokens).", sourceEventSeq: 63 } },
    ],
  });
  const row = document.querySelector(".cmd-row");
  check("重放后压缩行重建且为 done", row?.dataset.state === "done", row?.dataset.state);
  check("重放后摘要为条数文案", row?.querySelector(".cmd-summary")?.textContent === "已压缩 3 条历史记录(约 999 tokens)", row?.querySelector(".cmd-summary")?.textContent);
  check("重放后旧消息仍在(surface 不清历史)", document.querySelectorAll(".msg-user").length === 1, `users=${document.querySelectorAll(".msg-user").length}`);
  check("重放后压缩行仍可展开", row?.dataset.expandable === "true", row?.dataset.expandable);
}

// ---------- 6. 其他命令不受影响(仍走小字命令行) ----------
{
  const { document, post } = boot();
  post({ kind: "delta", events: [{ ...seq(70), type: "command/run", data: { commandId: "cmd-5", name: "plan", args: "" } }] });
  post({ kind: "delta", events: [{ ...seq(71), type: "command/done", data: { commandId: "cmd-5", kind: "success", text: "Plan mode on." } }] });
  post({ kind: "delta", events: [{ ...seq(72), type: "user/message", data: { content: [{ type: "text", text: "/plan off" }], source: { kind: "user" } } }] });
  check("非压缩命令不渲染命令行节点", document.querySelectorAll(".cmd-row").length === 0, `rows=${document.querySelectorAll(".cmd-row").length}`);
  check("斜杠命令仍以小字命令行呈现", document.querySelectorAll(".cmd-note").length === 1, `notes=${document.querySelectorAll(".cmd-note").length}`);
}

// ---------- 7. 入口即执行:斜杠菜单与 + 菜单都直接下发命令 ----------
{
  const { window, document, sent, post } = boot();
  post({ kind: "delta", events: [] });
  const input = document.querySelector("textarea.input");
  const baseline = sent.length;

  // 7a. 斜杠补全菜单:输入 /com 打开菜单,点「压缩上下文」直接执行(不插入文本)
  input.value = "/com";
  input.dispatchEvent(new window.Event("input", { bubbles: true }));
  const slashRows = [...document.querySelectorAll(".slash-menu .plus-menu-item")];
  const compactRow = slashRows.find((row) => row.textContent.includes("/compact"));
  check("斜杠菜单列出 /compact", compactRow !== undefined, slashRows.map((r) => r.textContent).join(" | "));
  compactRow?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  const slashSent = sent.slice(baseline);
  check(
    "斜杠菜单点击直接执行 /compact",
    slashSent.some((m) => m.kind === "command" && m.line === "/compact"),
    JSON.stringify(slashSent),
  );
  check("斜杠菜单点击后不再把 /compact 插入输入框", input.value === "/com", input.value);

  // 7b. 左下角 + 菜单同样直接执行
  const before = sent.length;
  document.querySelector(".plus-btn").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  const plusRows = [...document.querySelectorAll(".plus-menu-item")];
  const plusCompact = plusRows.find((row) => row.textContent.includes("压缩上下文"));
  check("+ 菜单列出「压缩上下文」", plusCompact !== undefined, plusRows.map((r) => r.textContent).join(" | "));
  plusCompact?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  const plusSent = sent.slice(before);
  check(
    "+ 菜单点击直接执行 /compact",
    plusSent.some((m) => m.kind === "command" && m.line === "/compact"),
    JSON.stringify(plusSent),
  );
  check("+ 菜单提示文案已更新为即时执行", plusCompact?.title?.includes("立即执行") === true, plusCompact?.title);
  check("+ 菜单点击不再改写输入框", input.value === "/com", input.value);
}

// ---------- 8. 常规渲染回归:普通消息 / 工具行 / 思考行不受锚点改造影响 ----------
{
  const { document, post } = boot();
  const events = [
    { ...seq(80), type: "turn/start", data: { turn: 1 } },
    { ...seq(81), type: "user/message", data: { content: [{ type: "text", text: "看下 README" }], source: { kind: "user" } } },
    {
      ...seq(82),
      type: "assistant/message",
      data: {
        turn: 1,
        step: 1,
        message: {
          content: [
            { type: "reasoning", text: "先读文件" },
            { type: "text", text: "好的,我来读。" },
            { type: "tool-call", id: "call-1", name: "read", arguments: '{"path":"README.md"}' },
          ],
          source: { provider: "deepseek", model: "m" },
        },
      },
    },
    { ...seq(83), type: "tool/call", data: { turn: 1, step: 1, callId: "call-1", name: "read", arguments: '{"path":"README.md"}' } },
    { ...seq(84), type: "tool/result", data: { turn: 1, step: 1, message: { source: { callId: "call-1" }, content: [{ type: "text", text: "文件内容" }] } } },
    { ...seq(85), type: "turn/end", data: { turn: 1, reason: { kind: "stop" } } },
    // 压缩区间内的回合:replace 只改动模型上下文,整个回合在对话里照旧显示
    {
      ...seq(90),
      type: "user/message",
      surfaceOp: { op: "replace", startSeq: 80, endSeq: 85 },
      data: { content: [{ type: "text", text: "checkpoint" }], source: { kind: "plugin", plugin: "compact", compactionId: "cp-x" } },
    },
  ];
  for (const e of events) post({ kind: "delta", events: [e] });
  check("replace 区间内的用户消息照常渲染", document.querySelectorAll(".msg-user").length === 1, `users=${document.querySelectorAll(".msg-user").length}`);
  check("replace 区间内的工具行照常渲染", document.querySelectorAll(".step-tool").length >= 1, `tools=${document.querySelectorAll(".step-tool").length}`);
  check("无孤儿压缩行", document.querySelectorAll(".cmd-row").length === 0, `rows=${document.querySelectorAll(".cmd-row").length}`);
  check("无孤立系统提示词卡片", document.querySelectorAll(".system-note").length === 0, `notes=${document.querySelectorAll(".system-note").length}`);
}

// ---------- 9. 常规渲染冒烟:无 surface 替换时一切照旧 ----------
{
  const { document, post } = boot();
  const events = [
    { ...seq(100), type: "turn/start", data: { turn: 1 } },
    { ...seq(101), type: "user/message", data: { content: [{ type: "text", text: "你好" }], source: { kind: "user" } } },
    {
      ...seq(102),
      type: "assistant/message",
      data: {
        turn: 1,
        step: 1,
        message: { content: [{ type: "reasoning", text: "想一下" }, { type: "tool-call", id: "call-2", name: "read", arguments: "{}" }], source: { provider: "deepseek", model: "m" } },
      },
    },
    { ...seq(103), type: "tool/call", data: { turn: 1, step: 1, callId: "call-2", name: "read", arguments: "{}" } },
    { ...seq(104), type: "user/message", data: { content: [{ type: "text", text: "Current runtime context." }], source: { kind: "plugin", plugin: "@deepseek-ai/dsh-system-prompt" } } },
  ];
  for (const e of events) post({ kind: "delta", events: [e] });
  check("用户消息正常渲染", document.querySelectorAll(".msg-user").length === 1, `users=${document.querySelectorAll(".msg-user").length}`);
  check("思考行正常渲染", document.querySelectorAll(".step-think").length >= 1, `think=${document.querySelectorAll(".step-think").length}`);
  check("工具行正常渲染", document.querySelectorAll(".step-tool").length >= 1, `tools=${document.querySelectorAll(".step-tool").length}`);
  check("系统提示词快照仍渲染为卡片", document.querySelectorAll(".system-note").length === 1, `notes=${document.querySelectorAll(".system-note").length}`);
}

// ---------- 10. 头部工具栏配色:跟随 VS Code 主题(不再整排主按钮蓝) ----------
{
  const css = fs.readFileSync("media/chat.css", "utf8");
  const block = (pattern) => {
    const m = pattern.exec(css);
    if (!m) return "";
    return css.slice(m.index, css.indexOf("}", m.index));
  };
  const base = block(/\.header-tool-row \.btn-icon,\s*\.header-session-row \.btn-icon \{/);
  check("头部工具按钮规则存在", base !== "", base.slice(0, 60));
  check("头部工具按钮背景透明", /background:\s*transparent/.test(base), base);
  check("图标色跟随主题 icon.foreground", /color:\s*var\(--vscode-icon-foreground/.test(base), base);
  check(
    "悬停底色使用主题 toolbar.hoverBackground",
    /var\(--vscode-toolbar-hoverBackground/.test(block(/\.header-tool-row \.btn-icon:hover,/)),
    block(/\.header-tool-row \.btn-icon:hover,/),
  );
  check(
    "按下/展开底色使用主题 toolbar.activeBackground",
    /var\(--vscode-toolbar-activeBackground/.test(css),
    "",
  );
  check("头部按钮不再使用实心主按钮底色", !/\.header-(tool|session)-row \.btn-icon[\s\S]{0,300}?var\(--dsh-btn-bg\)/.test(css), "");
  check(
    "对话框确认按钮仍保留主按钮底色",
    /\.dialog-confirm \{\s*background:\s*var\(--dsh-btn-bg\)/.test(css),
    block(/\.dialog-confirm \{/),
  );
}

// ---------- 11. 会话统计胶囊(网页端 StatsPills 同款):总量 + 点击展开明细 ----------
{
  const { window, document, post } = boot();
  // 与网页端截图同源的投影:4 轮 285 步 / 71,010,432 tok / 缓存命中 99.6%
  post({
    kind: "stats",
    value: {
      sessionStats: { turns: 4, steps: 285, llmMs: 1_461_000, toolMs: 3_151_000, ttftMs: 4_840, ttftSteps: 2, decodeMs: 827_000, decodeTokens: 220_800 },
      tokenUsage: { uncachedInputTokens: 251_298, cacheReadTokens: 70_537_984, cacheWriteTokens: 0, outputTokens: 221_150 },
    },
  });
  const line = document.querySelector(".stats-line");
  const pills = [...document.querySelectorAll(".stats-line .stat-pill")];
  check("底部渲染两枚统计胶囊", pills.length === 2, `pills=${pills.length}`);
  check("统计栏可见", line?.hidden === false, String(line?.hidden));
  const statsBtn = pills[0]?.querySelector(".stat-pill-btn");
  const usageBtn = pills[1]?.querySelector(".stat-pill-btn");
  check(
    "会话统计胶囊文案 =「4 轮 285 步 · 267 tok/s」",
    statsBtn?.textContent === "4 轮 285 步·267 tok/s",
    JSON.stringify(statsBtn?.textContent),
  );
  check(
    "Token 胶囊文案 =「71M tok · 缓存命中 99.6%」",
    usageBtn?.textContent === "71M tok·缓存命中 99.6%",
    JSON.stringify(usageBtn?.textContent),
  );

  // 点击会话统计胶囊 → 明细弹层
  statsBtn.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  let pop = document.querySelector(".turn-stat-pop");
  check("点击后弹出统计弹层", pop !== null);
  check("弹层标题为「会话统计」", pop?.querySelector(".ts-title")?.textContent === "会话统计", pop?.querySelector(".ts-title")?.textContent);
  const readRows = (panel) => {
    const dts = [...(panel?.querySelectorAll(".ts-rows dt") ?? [])];
    const dds = [...(panel?.querySelectorAll(".ts-rows dd") ?? [])];
    return dts.map((dt, i) => `${dt.textContent}=${dds[i]?.textContent}`).join(" | ");
  };
  check(
    "统计明细:模型用时 / 工具调用用时 / TTFT / TPS",
    readRows(pop) === "模型用时=24分21秒 | 工具调用用时=52分31秒 | 首 token 平均（TTFT）=2.4秒 | 输出速度（TPS）=267 tok/s",
    readRows(pop),
  );
  check("展开态 aria-expanded=true", statsBtn.getAttribute("aria-expanded") === "true", statsBtn.getAttribute("aria-expanded"));

  // 点击 Token 胶囊 → 用量明细(标题右侧为精确总量,明细为精确值)
  usageBtn.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  pop = document.querySelector(".turn-stat-pop");
  check("弹层标题为「Token 用量」", pop?.querySelector(".ts-title")?.textContent?.startsWith("Token 用量") === true, pop?.querySelector(".ts-title")?.textContent);
  check(
    "标题右侧为精确总量(千分位)",
    pop?.querySelector(".ts-title-value")?.textContent === "71,010,432 tok",
    pop?.querySelector(".ts-title-value")?.textContent,
  );
  check(
    "用量明细:缓存命中 / 未缓存输入 / 缓存读取 / 输出",
    readRows(pop) === "缓存命中=99.6% | 未缓存输入=251,298 tok | 缓存读取=70,537,984 tok | 输出=221,150 tok",
    readRows(pop),
  );

  // 无数据时整行隐藏
  const empty = boot();
  empty.post({ kind: "stats", value: {} });
  check("无统计时底部隐藏", empty.document.querySelector(".stats-line")?.hidden === true, String(empty.document.querySelector(".stats-line")?.hidden));
}

// ---------- 12. 缓存命中绝不把部分命中显示成 100%(网页端 formatCacheHitPercent 同款) ----------
{
  const { document, post } = boot();
  const percent = (cacheRead, uncached) => {
    post({ kind: "stats", value: { tokenUsage: { uncachedInputTokens: uncached, cacheReadTokens: cacheRead, cacheWriteTokens: 0, outputTokens: 100 } } });
    const text = document.querySelector(".stats-line .stat-pill-btn .stat-pill-label")?.textContent ?? "";
    return text.split("·").pop() ?? "";
  };
  check("部分命中 99.6% 不被进位成 100%", percent(996, 4) === "缓存命中 99.6%", percent(996, 4));
  check("极接近 100% 时提高精度", percent(999_999, 1) === "缓存命中 99.9999%", percent(999_999, 1));
  check("完全命中显示 100%", percent(1000, 0) === "缓存命中 100%", percent(1000, 0));
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} 通过`);
if (failed.length > 0) {
  console.log("失败项:");
  for (const f of failed) console.log(` - ${f.name}: ${f.detail}`);
  process.exit(1);
}
// 界面里的回合计时器等定时器会让事件循环常驻:断言完成后直接退出
process.exit(0);
