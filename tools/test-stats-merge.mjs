/**
 * 底部统计胶囊回归测试(长期保留):宿主对 sessionStats / tokenUsage 分别下发
 * 只带一个键的 {kind:"stats"} 消息,webview 必须按字段合并 —— 两条投影互不覆盖。
 * 覆盖顺序两种情况(先统计后用量 / 先用量后统计)与整份快照(init)路径。
 * 运行:node tools/test-stats-merge.mjs(先 npm run build 或手动构建 tmp/ui-harness.js)
 */
import { JSDOM } from "jsdom";
import { readFileSync } from "node:fs";

const BUNDLE = "tmp/ui-harness.js";
let code;
try {
  code = readFileSync(BUNDLE, "utf8");
} catch {
  console.error(`缺少 ${BUNDLE}:先执行 node ./node_modules/esbuild/bin/esbuild src/webview/ui.ts --bundle --platform=browser --format=iife --outfile=${BUNDLE}`);
  process.exit(2);
}

const SESSION_STATS = { turns: 2, steps: 101, llmMs: 120000, toolMs: 60000, ttftMs: 900, ttftSteps: 3, decodeMs: 20000, decodeTokens: 1500 };
const TOKEN_USAGE = { uncachedInputTokens: 12000, cacheReadTokens: 88000, cacheWriteTokens: 0, outputTokens: 4200 };

/**
 * `initStats` 可以是统计快照,也可以是 {events: [...]}(用于验证「无投影时由事件派生」)。
 */
function mount(initStats) {
  const statsSnapshot = initStats && !Array.isArray(initStats.events) ? initStats : undefined;
  const initEvents = Array.isArray(initStats?.events) ? initStats.events : [];
  const dom = new JSDOM(`<!doctype html><html><body><div id="app"></div><div id="messages"></div></body></html>`, {
    pretendToBeVisual: true,
    url: "https://localhost/",
  });
  const { window } = dom;
  window.acquireVsCodeApi = () => ({ postMessage: () => {}, getState: () => undefined, setState: () => {} });
  window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
  window.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
  window.cancelAnimationFrame = (id) => clearTimeout(id);
  window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
  window.scrollTo = () => {};
  window.HTMLElement.prototype.scrollIntoView = () => {};
  new window.Function("acquireVsCodeApi", "window", "document", "globalThis", code)(window.acquireVsCodeApi, window, window.document, window);
  const dispatch = (msg) => window.dispatchEvent(new window.MessageEvent("message", { data: msg }));
  dispatch({
    kind: "init",
    lang: "zh-cn",
    sessions: [{ sessionId: "s", title: "t", running: false, blank: false, updatedAt: Date.now() }],
    workspaces: [],
    workspaceOrder: [],
    archivedSessionIds: [],
    current: "s",
    events: initEvents,
    running: false,
    queue: [],
    jobs: [],
    approvals: [],
    questions: [],
    ...(statsSnapshot ? { stats: statsSnapshot } : {}),
    composerPrefs: { sendKey: "enter", fontFamily: "", autoCollapseProducedFiles: true },
  });
  return { window, dispatch };
}

/** 统计栏里的胶囊文案(取最外层按钮,避免重复计数)。 */
function pills(window) {
  const line = window.document.querySelector(".stats-line");
  if (!line) return [];
  return [...line.querySelectorAll("button")].map((b) => (b.textContent ?? "").replace(/\s+/g, " ").trim()).filter(Boolean);
}

/** 用量胶囊的判据是「缓存命中 …%」(轮/步胶囊里的 tok/s 不算用量胶囊)。 */
const hasUsagePill = (list) => list.some((x) => x.includes("缓存命中"));
/** 轮/步胶囊:投影样例是「… 101 步」,派生样例是「1 轮 1 步」,统一按「N 轮」判定。 */
const hasStatsPill = (list) => list.some((x) => /\d+\s*轮/.test(x));

let failures = 0;
const check = (name, ok, detail) => {
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
};

// ① 先统计后用量(真实常见顺序)
{
  const { window, dispatch } = mount(undefined);
  dispatch({ kind: "stats", sessionId: "s", value: { sessionStats: SESSION_STATS } });
  dispatch({ kind: "stats", sessionId: "s", value: { tokenUsage: TOKEN_USAGE } });
  const list = pills(window);
  check("先 sessionStats 后 tokenUsage:两枚胶囊都在", hasStatsPill(list) && hasUsagePill(list), JSON.stringify(list));
}

// ② 先用量后统计(反向顺序,旧实现会在这一步丢掉用量胶囊)
{
  const { window, dispatch } = mount(undefined);
  dispatch({ kind: "stats", sessionId: "s", value: { tokenUsage: TOKEN_USAGE } });
  const onlyUsage = pills(window);
  dispatch({ kind: "stats", sessionId: "s", value: { sessionStats: SESSION_STATS } });
  const both = pills(window);
  check(
    "先 tokenUsage 后 sessionStats:用量胶囊不被覆盖",
    hasUsagePill(onlyUsage) && hasUsagePill(both) && hasStatsPill(both),
    JSON.stringify(both),
  );
}

// ③ 整份快照(切换会话/重放路径)
{
  const { window } = mount({ sessionStats: SESSION_STATS, tokenUsage: TOKEN_USAGE });
  const list = pills(window);
  check("init 快照:两枚胶囊都在", hasStatsPill(list) && hasUsagePill(list), JSON.stringify(list));
}

// ④ 只有统计、没有用量时不应凭空出现用量胶囊
{
  const { window, dispatch } = mount(undefined);
  dispatch({ kind: "stats", sessionId: "s", value: { sessionStats: SESSION_STATS } });
  const list = pills(window);
  check("只有 sessionStats:不出现用量胶囊", hasStatsPill(list) && !hasUsagePill(list), JSON.stringify(list));
}

// ⑤ 只有用量、没有统计时同样只显示一枚
{
  const { window, dispatch } = mount(undefined);
  dispatch({ kind: "stats", sessionId: "s", value: { tokenUsage: TOKEN_USAGE } });
  const list = pills(window);
  check("只有 tokenUsage:不出现轮/步胶囊", hasUsagePill(list) && !hasStatsPill(list), JSON.stringify(list));
}

// ⑥ 别的会话的投影不得写进当前会话
{
  const { window, dispatch } = mount(undefined);
  dispatch({ kind: "stats", sessionId: "other", value: { sessionStats: SESSION_STATS } });
  check("非当前会话的投影被忽略", pills(window).length === 0, JSON.stringify(pills(window)));
}

// ⑦ 完全没有投影时:回合内的事件到达后必须由派生值渲染两枚胶囊
//   (重放阶段不渲染 DOM 增量,真实场景是回合进行中新事件到达时刷新)
{
  const { window, dispatch } = mount({ events: [{ event: { type: "turn/start", seq: 0, time: 1000, data: { turn: 1 } } }] });
  dispatch({
    kind: "delta",
    sessionId: "s",
    events: [
      { event: { type: "step/start", seq: 1, time: 1100, data: { turn: 1, step: 1 } } },
      { event: { type: "assistant/chunk", seq: 2, time: 1400, data: { turn: 1, step: 1, chunk: { type: "text-delta", index: 0, text: "hi" } } } },
      {
        event: {
          type: "assistant/message",
          seq: 3,
          time: 2600,
          data: {
            turn: 1,
            step: 1,
            message: { id: "m1", role: "assistant", content: [{ type: "text", text: "hi" }] },
            usage: { uncachedInputTokens: 1000, cacheReadTokens: 9000, cacheWriteTokens: 0, outputTokens: 250 },
          },
        },
      },
    ],
  });
  const list = pills(window);
  check("无投影 · 回合内事件派生:两枚胶囊都在", hasStatsPill(list) && hasUsagePill(list), JSON.stringify(list));
}

console.log(`\n结果: ${failures === 0 ? "全部符合预期" : `${failures} 项不符`}`);
process.exit(failures === 0 ? 0 : 1);
