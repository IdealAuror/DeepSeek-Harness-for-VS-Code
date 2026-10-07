/**
 * 运行中插队 / 排队消息的「分段」回归测试。
 *
 * 一个回合内部到达的用户消息必须把助手段切开:它**之后**产生的思考、文本、工具行
 * 要落在消息下方,而不是被塞回消息上方那个旧助手节点。旧行为的表现是:新输出跑到
 * 气泡上面、自己刚发的那条消息永远停在对话最底下(网页端按事件顺序渲染,天然不会这样)。
 *
 * 用 jsdom 加载构建产物 dist/webview/ui.js,喂入真实的 0.1.5-rc.1 事件序列。
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

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
  throw new Error("未找到 jsdom:请设置 DSH_JSDOM_ENTRY 指向 jsdom 入口");
}

const { JSDOM } = await loadJsdom();
const bundle = fs.readFileSync(process.env.DSH_BUNDLE ?? "dist/webview/ui.js", "utf8");

function boot({ lang = "zh-cn" } = {}) {
  const dom = new JSDOM('<!DOCTYPE html><html><body><div id="app"></div></body></html>', {
    runScripts: "outside-only",
    pretendToBeVisual: true,
    url: "https://localhost/",
  });
  const { window } = dom;
  window.acquireVsCodeApi = () => ({ postMessage: () => {}, getState: () => undefined, setState: () => undefined });
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  window.requestAnimationFrame = (fn) => setTimeout(() => fn(Date.now()), 0);
  window.cancelAnimationFrame = (id) => clearTimeout(id);
  window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
  window.eval(bundle);
  const post = (msg) => window.dispatchEvent(new window.MessageEvent("message", { data: msg }));
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
  return { window, document: window.document, post };
}

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail && !ok ? ` — ${detail}` : ""}`);
}

const seq = (n) => ({ seq: n, time: 1_700_000_000_000 + n });
const wire = (event) => ({ event });
/** a 是否排在 b 之后(DOM 顺序)。 */
const FOLLOWING = 4; // Node.DOCUMENT_POSITION_FOLLOWING
const isAfter = (a, b) => !!a && !!b && (a.compareDocumentPosition(b) & FOLLOWING) !== 0;

const userMsg = (n, text) => ({ ...seq(n), type: "user/message", data: { content: [{ type: "text", text }], source: { kind: "user" } } });
const assistantMsg = (n, turn, step, blocks) => ({
  ...seq(n),
  type: "assistant/message",
  data: { turn, step, message: { content: blocks, source: { provider: "deepseek", model: "m" } } },
});
const toolCall = (n, turn, step, callId, name) => ({ ...seq(n), type: "tool/call", data: { turn, step, callId, name, arguments: "{}" } });
const toolResult = (n, turn, step, callId, text) => ({
  ...seq(n),
  type: "tool/result",
  data: { turn, step, message: { source: { callId }, content: [{ type: "text", text }] } },
});
const chunk = (turn, step, value) => ({ kind: "streamChunk", sessionId: "s1", value: { turn, step, time: 1_700_000_000_500, chunk: value } });

// ---------- 1. 运行中插队:同一回合内的用户消息必须把助手段切开 ----------
{
  const { document, post } = boot();
  const events = [
    { ...seq(10), type: "turn/start", data: { turn: 1 } },
    userMsg(11, "第一句"),
    assistantMsg(12, 1, 1, [{ type: "text", text: "好的" }, { type: "tool-call", id: "call-1", name: "read", arguments: "{}" }]),
    toolCall(13, 1, 1, "call-1", "read"),
    toolResult(14, 1, 1, "call-1", "文件内容"),
    // 运行中插队:turn/end 还没到,消息就进了同一个回合
    userMsg(15, "插队补一句"),
  ];
  for (const e of events) post({ kind: "delta", events: [wire(e)] });
  // 插队之后,同一回合继续产出:流式思考 + 新工具行
  post(chunk(1, 2, { type: "block-start", index: 0, blockType: "reasoning" }));
  post(chunk(1, 2, { type: "reasoning-delta", text: "插队之后继续想" }));
  post(chunk(1, 2, { type: "block-start", index: 1, blockType: "text" }));
  post(chunk(1, 2, { type: "text-delta", text: "插队之后的回答" }));
  post({ kind: "delta", events: [wire(toolCall(20, 1, 2, "call-2", "grep"))] });

  const users = [...document.querySelectorAll(".msg-user")];
  const tools = [...document.querySelectorAll(".step-tool")];
  const steer = users[1];
  const text = document.body.textContent ?? "";

  check("两条用户消息都在", users.length === 2, `users=${users.length}`);
  check("插队消息后产生了新的工具行", tools.length === 2, `tools=${tools.length}`);
  check("新工具行排在插队消息**之后**", isAfter(steer, tools[tools.length - 1]), "工具行跑到了气泡上方");
  check(
    "插队后的思考/回答也排在插队消息之后",
    text.indexOf("插队补一句") < text.indexOf("插队之后继续想") && text.indexOf("插队补一句") < text.indexOf("插队之后的回答"),
    `user@${text.indexOf("插队补一句")} think@${text.indexOf("插队之后继续想")} answer@${text.indexOf("插队之后的回答")}`,
  );
  const assistants = [...document.querySelectorAll(".msg-assistant")];
  check("插队把回合切成前后两段", assistants.length === 2, `assistant=${assistants.length}`);
  check(
    "两段分别落在插队消息两侧",
    assistants.length === 2 && !isAfter(steer, assistants[0]) && isAfter(steer, assistants[1]),
    "分段位置不对",
  );
  check("自己刚发的消息不再停在最底下", isAfter(steer, assistants[assistants.length - 1]), "气泡后面没有任何内容");
}

// ---------- 2. 排队消息(运行中发送 → 队列快照)同样切开助手段 ----------
{
  const { document, post } = boot();
  for (const e of [
    { ...seq(30), type: "turn/start", data: { turn: 1 } },
    userMsg(31, "第一句"),
    assistantMsg(32, 1, 1, [{ type: "tool-call", id: "call-1", name: "read", arguments: "{}" }]),
    toolCall(33, 1, 1, "call-1", "read"),
  ]) {
    post({ kind: "delta", events: [wire(e)] });
  }
  post({ kind: "queue", items: [{ id: "q1", placement: "queued", message: { content: [{ type: "text", text: "排队的那句" }] } }] });
  const queued = document.querySelector(".msg-queued");
  check("排队消息渲染为排队卡片", queued !== null, "未找到 .msg-queued");
  post({ kind: "delta", events: [wire(toolCall(34, 1, 2, "call-2", "grep"))] });
  const tools = [...document.querySelectorAll(".step-tool")];
  check("排队卡片之后的工具行排在它下方", isAfter(queued, tools[tools.length - 1]), "工具行跑到了排队卡片上方");
}

// ---------- 3. 回归:普通多回合不受影响(每回合一个助手段,顺序照旧) ----------
{
  const { document, post } = boot();
  for (const e of [
    { ...seq(40), type: "turn/start", data: { turn: 1 } },
    userMsg(41, "回合一的问题"),
    assistantMsg(42, 1, 1, [{ type: "text", text: "回合一的回答" }, { type: "tool-call", id: "call-1", name: "read", arguments: "{}" }]),
    toolCall(43, 1, 1, "call-1", "read"),
    toolResult(44, 1, 1, "call-1", "内容"),
    { ...seq(45), type: "turn/end", data: { turn: 1, reason: { kind: "stop" } } },
    { ...seq(46), type: "turn/start", data: { turn: 2 } },
    userMsg(47, "回合二的问题"),
    assistantMsg(48, 2, 1, [{ type: "text", text: "回合二的回答" }]),
  ]) {
    post({ kind: "delta", events: [wire(e)] });
  }
  const users = [...document.querySelectorAll(".msg-user")];
  const tools = [...document.querySelectorAll(".step-tool")];
  const text = document.body.textContent ?? "";
  check("两个回合的用户消息都在", users.length === 2, `users=${users.length}`);
  check("每回合各一个助手节点", document.querySelectorAll(".msg-assistant").length === 2, `assistant=${document.querySelectorAll(".msg-assistant").length}`);
  check("回合一的工具行仍在回合一气泡之后", isAfter(users[0], tools[0]), "顺序异常");
  check("回合二的回答排在回合二问题之后", text.indexOf("回合二的问题") < text.indexOf("回合二的回答"), "顺序异常");
  check("回合二的回答排在回合一工具行之后", text.indexOf("内容") < text.indexOf("回合二的回答"), "顺序异常");
}

// ---------- 4. 回归:压缩检查点(user/message 但不是用户发言)不该切开助手段 ----------
{
  const { document, post } = boot();
  for (const e of [
    { ...seq(50), type: "turn/start", data: { turn: 1 } },
    userMsg(51, "压缩前的问题"),
    assistantMsg(52, 1, 1, [{ type: "tool-call", id: "call-1", name: "read", arguments: "{}" }]),
    toolCall(53, 1, 1, "call-1", "read"),
    { ...seq(54), type: "compaction/start", data: { compactionId: "cp-1", turn: 1 } },
    { ...seq(55), type: "compaction/summary", data: { compactionId: "cp-1", summary: [{ type: "text", text: "摘要" }], shadowedSeqs: [1, 2], shadowedTokenCount: 10 } },
    {
      ...seq(56),
      type: "user/message",
      surfaceOp: { op: "replace", startSeq: 1, endSeq: 53 },
      data: { content: [{ type: "text", text: "checkpoint" }], source: { kind: "plugin", plugin: "compact", compactionId: "cp-1" } },
    },
  ]) {
    post({ kind: "delta", events: [wire(e)] });
  }
  check("压缩检查点不渲染成用户气泡", document.querySelectorAll(".msg-user").length === 1, `users=${document.querySelectorAll(".msg-user").length}`);
  check("压缩行仍在", document.querySelectorAll(".cmd-row").length === 1, `rows=${document.querySelectorAll(".cmd-row").length}`);
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} 通过`);
if (failed.length > 0) {
  console.log("失败项:");
  for (const f of failed) console.log(`  - ${f.name}`);
}
process.exit(failed.length === 0 ? 0 : 1);
