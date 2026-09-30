/**
 * issue #19 回归测试:上下文超限 / 回合失败必须在对话里留下提示。
 *
 * 覆盖:
 * 1. turn/end reason.kind=error + code=CONTEXT_WINDOW_EXCEEDED → 对话内失败卡
 *    (标题、读数文案、压缩/换模型动作,点击动作真的发出 /compact 与打开模型列表);
 * 2. 仅靠提供方文本(context length / too many tokens)也能识别为上下文超限;
 * 3. 普通失败(code 非上下文类)→ 通用失败卡,不带压缩动作;
 * 4. kind=max-tokens → 输出上限卡;
 * 5. 成功回合(kind=completed)不出卡;
 * 6. 同一回合重复上报失败不叠卡;
 * 7. 历史重放出卡(idempotent),失败卡不会重复;
 * 8. 上下文进度环的 75%/90% 分档与面板内建议动作;
 * 9. 发送前守卫:预计越界时落卡 + toast,未越界时不打扰。
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
  throw new Error("jsdom 未安装:请 npm i jsdom,或用 DSH_JSDOM_ENTRY 指向入口");
}

const { JSDOM } = await loadJsdom();
const root = path.dirname(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")));
const bundle = fs.readFileSync(path.join(root, "dist/webview/ui.js"), "utf8");

function boot({ context } = {}) {
  const dom = new JSDOM('<!DOCTYPE html><html><body><div id="app"></div></body></html>', {
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
  const post = (msg) => window.dispatchEvent(new window.MessageEvent("message", { data: msg }));
  post({
    kind: "init",
    sessions: [{ sessionId: "s1", updatedAt: Date.now(), running: false, blank: false, title: "test" }],
    current: "s1",
    running: false,
    hasMore: false,
    events: [],
    lang: "zh-cn",
    languagePref: "zh-cn",
    ...(context ? { context } : {}),
  });
  return { window, document: window.document, sent, post };
}

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail && !ok ? ` — ${detail}` : ""}`);
}

let t = 1_700_000_000_000;
const ev = (type, data, extra = {}) => ({ event: { type, seq: (t += 1), time: t, data, ...extra } });

// ---------- 1. 上下文超限失败 → 对话内卡片 + 动作 ----------
{
  const { window, document, sent, post } = boot({ context: { projectedTokens: 210_000, contextWindow: 200_000, pressureTokens: 205_000 } });
  // 模型目录到达后模型胶囊可点(无目录时禁用,聊天视图与宿主一致)
  post({
    kind: "models",
    sessionId: "s1",
    value: {
      current: { provider: "p", model: "m1" },
      routable: true,
      groups: [{ id: "p", name: "P", models: [{ id: "m1", name: "M1" }, { id: "m2", name: "M2" }] }],
      failures: [],
    },
  });
  post({ kind: "delta", sessionId: "s1", events: [ev("turn/start", { turn: 3 })] });
  post({
    kind: "delta",
    sessionId: "s1",
    events: [
      ev("turn/end", {
        turn: 3,
        reason: { kind: "error", error: { code: "CONTEXT_WINDOW_EXCEEDED", message: "This endpoint's maximum context length is 200000 tokens" } },
      }),
    ],
  });
  const card = document.querySelector(".msg-alert");
  check("超限失败渲染对话内提示卡", card !== null);
  check("卡片为危险配色", card?.classList.contains("alert-error") === true, card?.className);
  check("标题为「上下文已超出模型窗口」", card?.querySelector(".msg-alert-title")?.textContent === "上下文已超出模型窗口", card?.querySelector(".msg-alert-title")?.textContent);
  const body = card?.querySelector(".msg-alert-body")?.textContent ?? "";
  check("正文带读数与提供方原文", body.includes("210K / 200K") && body.includes("maximum context length"), body);
  const buttons = [...(card?.querySelectorAll(".msg-alert-action") ?? [])].map((b) => b.textContent);
  check("提供压缩上下文与切换模型两个动作", buttons.includes("压缩上下文") && buttons.includes("切换模型"), buttons.join("|"));

  sent.length = 0;
  card.querySelectorAll(".msg-alert-action")[0].dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  check("点击压缩发出 /compact", sent.some((m) => m.kind === "command" && m.line === "/compact"), JSON.stringify(sent));

  // 点击切换模型:模型列表弹层被打开
  card.querySelectorAll(".msg-alert-action")[1].dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  const pop = document.querySelector(".model-pill-pop");
  check("点击切换模型打开模型列表", pop !== null && pop.hidden === false, String(pop?.hidden));

  // 同一回合重复上报:不叠卡
  post({ kind: "delta", sessionId: "s1", events: [ev("turn/end", { turn: 3, reason: { kind: "error", error: { code: "CONTEXT_WINDOW_EXCEEDED", message: "again" } } })] });
  check("重复上报不叠加卡片", document.querySelectorAll(".msg-alert").length === 1, String(document.querySelectorAll(".msg-alert").length));
}

// ---------- 2. 只有提供方文本(无结构化 code)也能识别 ----------
for (const message of [
  "This model's maximum context length is 128000 tokens",
  "prompt is too long: 210000 tokens > 200000 maximum",
  "too many tokens in request",
]) {
  const { document, post } = boot({ context: { projectedTokens: 150_000, contextWindow: 128_000 } });
  post({ kind: "delta", sessionId: "s1", events: [ev("turn/end", { turn: 1, reason: { kind: "error", error: { message } } })] });
  const card = document.querySelector(".msg-alert");
  check(`文本识别为上下文超限:${message.slice(0, 32)}…`, card?.classList.contains("alert-error") === true, card?.className);
  check(`  并给出压缩动作:${message.slice(0, 20)}…`, card?.querySelectorAll(".msg-alert-action").length === 2, String(card?.querySelectorAll(".msg-alert-action").length));
}

// ---------- 3. 普通失败:通用卡,无压缩动作 ----------
{
  const { document, post } = boot();
  post({ kind: "delta", sessionId: "s1", events: [ev("turn/end", { turn: 2, reason: { kind: "error", error: { code: "AUTH", message: "401 unauthorized" } } })] });
  const card = document.querySelector(".msg-alert");
  check("普通失败渲染警告卡", card?.classList.contains("alert-warn") === true, card?.className);
  check("标题为「回合失败」", card?.querySelector(".msg-alert-title")?.textContent === "回合失败", card?.querySelector(".msg-alert-title")?.textContent);
  check("正文带 code 与 message", (card?.querySelector(".msg-alert-body")?.textContent ?? "").includes("AUTH: 401 unauthorized"), card?.querySelector(".msg-alert-body")?.textContent);
  check("普通失败不提供压缩动作", card?.querySelectorAll(".msg-alert-action").length === 0, String(card?.querySelectorAll(".msg-alert-action").length));
}

// ---------- 4. max-tokens ----------
{
  const { document, post } = boot();
  post({ kind: "delta", sessionId: "s1", events: [ev("turn/end", { turn: 2, reason: { kind: "max-tokens" } })] });
  const card = document.querySelector(".msg-alert");
  check("max-tokens 渲染输出上限卡", card?.querySelector(".msg-alert-title")?.textContent === "已达模型输出上限", card?.querySelector(".msg-alert-title")?.textContent);
}

// ---------- 5. 成功回合不出卡 ----------
{
  const { document, post } = boot();
  post({ kind: "delta", sessionId: "s1", events: [ev("turn/end", { turn: 1, reason: { kind: "completed" } })] });
  check("成功回合不出卡", document.querySelectorAll(".msg-alert").length === 0, String(document.querySelectorAll(".msg-alert").length));
}

// ---------- 6. 历史重放:失败卡随 turn/end 重建且不重复 ----------
{
  const { document, post } = boot({ context: { projectedTokens: 150_000, contextWindow: 128_000 } });
  const history = [
    ev("turn/start", { turn: 1 }),
    ev("user/message", { content: [{ type: "text", text: "hi" }], source: { kind: "user" } }),
    ev("turn/end", { turn: 1, reason: { kind: "error", error: { code: "CONTEXT_WINDOW_EXCEEDED", message: "boom" } } }),
  ];
  post({ kind: "init", sessions: [{ sessionId: "s1", updatedAt: Date.now(), running: false, blank: false }], current: "s1", events: history, lang: "zh-cn" });
  check("重放历史重建失败卡", document.querySelectorAll(".msg-alert").length === 1, String(document.querySelectorAll(".msg-alert").length));
  check("重放出的历史卡片不提供动作", document.querySelector(".msg-alert")?.querySelectorAll(".msg-alert-action").length === 0, String(document.querySelector(".msg-alert")?.querySelectorAll(".msg-alert-action").length));
  post({ kind: "delta", sessionId: "s1", events: history });
  check("重放同批事件不重复出卡", document.querySelectorAll(".msg-alert").length === 1, String(document.querySelectorAll(".msg-alert").length));
}

// ---------- 7. 上下文进度环分档 ----------
{
  const { document, post } = boot({ context: { projectedTokens: 50_000, contextWindow: 200_000 } });
  const meter = document.querySelector(".context-meter");
  check("低于阈值时无分档标记", meter?.dataset.tier === "ok", meter?.dataset.tier);
  check("低于阈值时不显示建议动作", document.querySelector(".cm-hint") === null);
  post({ kind: "context", value: { projectedTokens: 160_000, contextWindow: 200_000 } });
  check("80% 进入警告分档", document.querySelector(".context-meter")?.dataset.tier === "warn", document.querySelector(".context-meter")?.dataset.tier);
  check("警告分档显示建议动作", document.querySelector(".cm-hint") !== null);
  post({ kind: "context", value: { projectedTokens: 190_000, contextWindow: 200_000 } });
  check("95% 进入危险分档", document.querySelector(".context-meter")?.dataset.tier === "critical", document.querySelector(".context-meter")?.dataset.tier);
}

// ---------- 8. 发送前守卫 ----------
{
  // 接近上限(算上本次输入仍在窗口内)→ 警告档,仍然提供压缩/换模型
  const { window, document } = boot({ context: { projectedTokens: 195_000, contextWindow: 200_000 } });
  // 输入框选择器必须锁定输入区的 textarea(容器里还有弹层的 dialog-textarea)
  const input = document.querySelector("textarea.input");
  input.value = "再补一段说明,请继续";
  input.dispatchEvent(new window.Event("input", { bubbles: true }));
  document.querySelector(".send-btn")?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  const card = document.querySelector(".msg-alert");
  check("接近上限时给出对话内提示", card !== null, document.body.innerHTML.slice(0, 200));
  check("接近上限为警告档", card?.classList.contains("alert-warn") === true, card?.className);
  check("提示带压缩与换模型两个动作", card?.querySelectorAll(".msg-alert-action").length === 2, String(card?.querySelectorAll(".msg-alert-action").length));
  check("同时给出 toast(带一键压缩)", document.querySelector(".toast-warning .toast-action") !== null, document.querySelector(".toast-box")?.innerHTML?.slice(0, 120));
  check("提示正文给出预计读数", (card?.querySelector(".msg-alert-body")?.textContent ?? "").includes("195K / 200K"), card?.querySelector(".msg-alert-body")?.textContent);

  // 连续发送:不叠卡
  document.querySelector(".send-btn")?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  check("连续发送不叠加提示卡", document.querySelectorAll(".msg-alert").length === 1, String(document.querySelectorAll(".msg-alert").length));
}

{
  // 算上本次输入已越界 → 危险档
  const { window, document } = boot({ context: { projectedTokens: 199_000, contextWindow: 200_000 } });
  const input = document.querySelector("textarea.input");
  input.value = "x".repeat(6000);
  input.dispatchEvent(new window.Event("input", { bubbles: true }));
  document.querySelector(".send-btn")?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  const card = document.querySelector(".msg-alert");
  check("预计越界时为危险档", card?.classList.contains("alert-error") === true, card?.className);
  check("越界提示说明宿主会自动压缩", (card?.querySelector(".msg-alert-body")?.textContent ?? "").includes("自动压缩"), card?.querySelector(".msg-alert-body")?.textContent);
}

{
  const { window, document } = boot({ context: { projectedTokens: 1_000, contextWindow: 200_000 } });
  const input = document.querySelector("textarea.input");
  input.value = "普通提问";
  input.dispatchEvent(new window.Event("input", { bubbles: true }));
  document.querySelector(".send-btn")?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  check("远未越界时不打扰", document.querySelectorAll(".msg-alert").length === 0, String(document.querySelectorAll(".msg-alert").length));
}

// ---------- 9. 发送前预警 → 真实失败:只留一张卡 ----------
{
  const { window, document } = boot({ context: { projectedTokens: 199_000, contextWindow: 200_000 } });
  const input = document.querySelector("textarea.input");
  input.value = "x".repeat(6000);
  input.dispatchEvent(new window.Event("input", { bubbles: true }));
  document.querySelector(".send-btn")?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  check("先出预警卡", document.querySelectorAll(".msg-alert").length === 1, String(document.querySelectorAll(".msg-alert").length));
  // 同一界面继续收到真实失败:预警卡被失败卡取代
  window.dispatchEvent(new window.MessageEvent("message", { data: { kind: "delta", sessionId: "s1", events: [ev("turn/end", { turn: 4, reason: { kind: "error", error: { code: "CONTEXT_WINDOW_EXCEEDED", message: "boom" } } })] } }));
  const cards = document.querySelectorAll(".msg-alert");
  check("真实失败取代预警卡(只剩一张)", cards.length === 1, String(cards.length));
  check("留下的是危险档失败卡", cards[0]?.classList.contains("alert-error") === true, cards[0]?.className);
  check("失败卡带两个动作", cards[0]?.querySelectorAll(".msg-alert-action").length === 2, String(cards[0]?.querySelectorAll(".msg-alert-action").length));
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length > 0) process.exitCode = 1;
