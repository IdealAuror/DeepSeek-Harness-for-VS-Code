import { readFileSync } from "node:fs";
const panels = readFileSync("dist/webview/ui.js", "utf8");
// DSH 用户技能 的转义:用(7528)户(6237)技(6280)能(80FD) —— 检查 t() 调用是否带该键
const i = panels.indexOf("dshUserSkills");
console.log("dshUserSkills idx:", i);
const esc = "\\u7528\\u6237\\u6280\\u80FD";
console.log("escaped key present:", panels.includes(esc));
// 找 dshUserSkills 附近的 label 赋值
if (i >= 0) console.log("ctx:", panels.slice(i - 80, i + 80).replace(/\n/g, " "));
