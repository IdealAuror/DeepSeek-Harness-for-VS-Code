/**
 * 修复并发编辑导致的「变量先用后声明」(src/webview/ui.ts:1389 用 SEND_KEY_LABELS,
 * 但该表声明在 3252 行):把这三张表移到首个使用点之前,内容不变。
 */
import { readFileSync, writeFileSync } from "node:fs";
const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const path = `${root}src/webview/ui.ts`;

const text = readFileSync(path, "utf8");
const lines = text.split(/\r?\n/);

const startMarker = "/** 发送键快捷入口的文案与提示(设置面板与输入框胶囊共用同一份描述)。 */";
const start = lines.findIndex((l) => l.trim() === startMarker);
if (start < 0) throw new Error("找不到 SEND_KEY_LABELS 声明块");
const orderLine = lines.findIndex((l, i) => i > start && l.startsWith("const SEND_KEY_ORDER"));
if (orderLine < 0) throw new Error("找不到 SEND_KEY_ORDER 行");
const block = lines.slice(start, orderLine + 1);
const rest = [...lines.slice(0, start), ...lines.slice(orderLine + 1)];

const useMarker = "const btnSendKey = el(\"button\", \"btn btn-icon\");";
const use = rest.findIndex((l) => l.trim() === useMarker);
if (use < 0) throw new Error("找不到 btnSendKey 声明");
// 插到使用点所在注释块之前
let insertAt = use;
while (insertAt > 0 && rest[insertAt - 1].trim().startsWith("//")) insertAt--;
const out = [...rest.slice(0, insertAt), ...block, "", ...rest.slice(insertAt)];
writeFileSync(path, out.join("\n"), "utf8");
console.log(`SEND_KEY_* 表已从第 ${start + 1} 行移到第 ${insertAt + 1} 行之前`);
