/**
 * 删除已废弃的词典键(会话统计栏改版后不再使用的旧文案):
 * 从 EN_TEXT(ui.ts)与 12 语言 texts/*.json 中一并移除。
 */
import fs from "node:fs";
import path from "node:path";

const root = "D:/Workspace/vscode";
const textsDir = path.join(root, "src/webview/texts");
const uiFile = path.join(root, "src/webview/ui.ts");

const DEAD = [
  "{n} 轮 · {m} 步",
  "{turns} 轮 · {steps} 步",
  "LLM {d} · 工具 {t}",
  "首 token 平均 {s}s",
  "输入 {i} tok · 输出 {o} tok",
];

for (const file of fs.readdirSync(textsDir)) {
  const full = path.join(textsDir, file);
  const dict = JSON.parse(fs.readFileSync(full, "utf8"));
  let removed = 0;
  for (const key of DEAD) {
    if (dict[key] !== undefined) {
      delete dict[key];
      removed += 1;
    }
  }
  fs.writeFileSync(full, `${JSON.stringify(dict, null, 2)}\n`, "utf8");
  console.log(`${file}: -${removed}`);
}

const lines = fs.readFileSync(uiFile, "utf8").split(/\r?\n/);
const kept = lines.filter((line) => !DEAD.some((key) => line.trimStart().startsWith(`${JSON.stringify(key)}:`)));
fs.writeFileSync(uiFile, kept.join("\n"), "utf8");
console.log(`EN_TEXT: -${lines.length - kept.length}`);
