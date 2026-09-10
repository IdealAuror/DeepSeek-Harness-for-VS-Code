/**
 * 时间线样式收敛:去掉每行的竖线 + 刻度(视觉太碎),改为每个"过程段"一条细导轨。
 * 同时修掉标题被 40% 宽度截断成「思…」的问题(标题不再限宽,摘要负责省略)。
 */
import fs from "node:fs";

const file = "D:/Workspace/vscode/media/chat.css";
let css = fs.readFileSync(file, "utf8");
const before = css.length;

// 1) 每行的竖线与刻度整段删除
const railBlock = `/* 左侧时间线导轨:每行一段竖线 + 一小段刻度,与网页端过程区一致 */
.step-row {
  position: relative;
  margin: 0 0 2px;
  border: none;
  border-radius: 0;
  padding: 0 0 0 14px;
}

.step-row::before {
  content: "";
  position: absolute;
  left: 4px;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--dsh-border);
}

.step-row::after {
  content: "";
  position: absolute;
  left: 0;
  top: 13px;
  width: 9px;
  height: 1px;
  background: var(--dsh-border);
}
`;
const replacement = `/* 过程段:连续的过程行(思考 / 工具)共用一条细导轨,而不是每行一小截 */
.step-group {
  display: flex;
  flex-direction: column;
  gap: 1px;
  margin: 2px 0 6px;
  padding-left: 11px;
  border-left: 1px solid var(--dsh-border);
}

.step-row {
  position: relative;
  margin: 0;
  border: none;
  border-radius: 0;
  padding: 0;
}
`;
const railPlaceholder = railBlock.replace(/\n/g, "\r\n");
if (css.includes(railPlaceholder)) {
  css = css.replace(railPlaceholder, replacement.replace(/\n/g, "\r\n"));
  console.log("rail replaced");
} else {
  console.log("RAIL BLOCK MISS");
}

// 2) 标题不再限宽(此前 max-width:40% 会把「思考」截成「思…」)
css = css.replace(
  ".step-name {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  gap: 6px;\r\n  flex: none;\r\n  max-width: 40%;\r\n  overflow: hidden;\r\n  white-space: nowrap;\r\n}",
  ".step-name {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  gap: 6px;\r\n  flex: none;\r\n  white-space: nowrap;\r\n}",
);

// 3) 行更紧凑一点(26px → 24px),hover 底色更淡
css = css.replace(".step-line {\r\n  display: flex;\r\n  align-items: center;\r\n  min-width: 0;\r\n  height: 26px;", ".step-line {\r\n  display: flex;\r\n  align-items: center;\r\n  min-width: 0;\r\n  height: 24px;");
css = css.replace("  background: var(--vscode-list-hoverBackground, rgba(128, 128, 128, 0.12));\r\n}\r\n\r\n.step-name", "  background: var(--vscode-list-hoverBackground, rgba(128, 128, 128, 0.12));\r\n}\r\n\r\n.step-name");

fs.writeFileSync(file, css);
console.log(`css ${before} → ${css.length}`);
