/** 缩小输入框底部的胶囊与 / 按钮:三处字号/高度统一调小(用户反馈文本偏大)。 */
import fs from "node:fs";

const file = "D:/Workspace/vscode/media/chat.css";
let css = fs.readFileSync(file, "utf8");
const before = css;

const rules = [
  // 权限 / 模型 / 预设胶囊:12px → 11px,高度 26px → 24px
  { sel: ".model-pill-head", from: { "font-size": "12px", height: "26px" }, to: { "font-size": "11px", height: "24px" } },
  { sel: ".permission-pill-head", from: { "font-size": "12px", height: "26px" }, to: { "font-size": "11px", height: "24px" } },
  { sel: ".preset-pill-head", from: { "font-size": "12px", height: "26px" }, to: { "font-size": "11px", height: "24px" } },
];

for (const rule of rules) {
  const pattern = new RegExp(`(\\${rule.sel}\\s*\\{[^}]*\\})`, "m");
  const match = pattern.exec(css);
  if (!match) {
    console.log(`MISS ${rule.sel}`);
    continue;
  }
  let block = match[1];
  for (const [key, value] of Object.entries(rule.from)) {
    block = block.replace(`${key}: ${value};`, `${key}: ${rule.to[key]};`);
  }
  css = css.replace(match[1], block);
  console.log(`patched ${rule.sel}`);
}

// / 按钮:26px → 22px(图标由 13 → 12 在 ui.ts 中同步)
const plusPattern = /(\.plus-btn\s*\{[^}]*\})/m;
const plusMatch = plusPattern.exec(css);
if (plusMatch) {
  const patched = plusMatch[1]
    .replace("width: 26px;", "width: 22px;")
    .replace("height: 26px;", "height: 22px;")
    .replace("font-size: 16px;", "font-size: 14px;");
  css = css.replace(plusMatch[1], patched);
  console.log("patched .plus-btn");
} else {
  console.log("MISS .plus-btn");
}

fs.writeFileSync(file, css);
console.log(`changed: ${before !== css}`);
