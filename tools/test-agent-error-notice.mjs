/**
 * issue #19 宿主侧回归:api-session/error(回合内失败)以前只被 waitIdle 订阅,
 * 用户端毫无反馈 —— 现在当前会话必须转成一条错误提示,其他会话保持安静。
 *
 * 直接构造 DshHub(不连服务器),把 $events 的 emit 帧喂进 store,
 * 断言 onNotice 的行为与文案。
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const root = path.dirname(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")));
const require = createRequire(import.meta.url);

// hub.ts 依赖 vscode 之外无副作用,但仍以 CJS 打包后再导入(与扩展实际加载方式一致)
const esbuild = require(path.join(root, "node_modules", "esbuild"));
const out = path.join(root, "tmp", "hub-test-bundle.cjs");
await esbuild.build({
  entryPoints: [path.join(root, "src/dsh/hub.ts")],
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node20",
  outfile: out,
  logLevel: "error",
  external: ["vscode"],
});
const { DshHub: Hub } = require(out);

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail && !ok ? ` — ${detail}` : ""}`);
}

const notices = [];
const hub = new Hub({
  url: "http://127.0.0.1:1",
  command: "dsh",
  autoStart: false,
  autoStartTimeoutSec: 5,
  onNotice: (message, kind) => notices.push({ message, kind }),
  t: (key, args) => `${key}:${args?.message ?? ""}`,
});

hub.store.sessions.set("s1", { sessionId: "s1", updatedAt: Date.now(), running: true, blank: false });
hub.store.sessions.set("s2", { sessionId: "s2", updatedAt: Date.now(), running: true, blank: false });
hub.store.currentSessionId = "s1";

// 当前会话失败 → 一条错误提示
hub.store.handleApiSessionEvent("api-session/error", ["s1", "context window exceeded: 210000 > 200000 tokens"]);
check("当前会话失败给出提示", notices.length === 1, JSON.stringify(notices));
check("提示为 error 级", notices[0]?.kind === "error", notices[0]?.kind);
check("提示带 hub.agentError 键与原文", notices[0]?.message?.includes("hub.agentError") && notices[0]?.message?.includes("context window exceeded"), notices[0]?.message);

// 其他会话失败 → 不打扰
hub.store.handleApiSessionEvent("api-session/error", ["s2", "boom"]);
check("其他会话失败不打扰当前界面", notices.length === 1, JSON.stringify(notices));

// 超长错误被截断
const long = "x".repeat(1000);
hub.store.handleApiSessionEvent("api-session/error", ["s1", long]);
check("超长错误截断到 400 字内", (notices.at(-1)?.message ?? "").length < 500, String((notices.at(-1)?.message ?? "").length));

// 失败后会话不再标记为运行中(既有行为保持不变)
check("失败会话被置为未运行", hub.store.sessions.get("s1")?.running === false, String(hub.store.sessions.get("s1")?.running));

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length > 0) process.exitCode = 1;
