/** .step-title 加上 flex:none —— 防止作为 flex 子项被长摘要压缩成一个字。 */
import fs from "node:fs";

const file = "D:/Workspace/vscode/media/chat.css";
let css = fs.readFileSync(file, "utf8");
const before = ".step-title {\r\n  overflow: hidden;";
const after = ".step-title {\r\n  flex: none;\r\n  min-width: 0;\r\n  overflow: hidden;";
if (!css.includes(before)) {
  console.log("PATTERN MISS");
  process.exit(1);
}
css = css.replace(before, after);
fs.writeFileSync(file, css);
console.log("patched .step-title");
