import { readFileSync } from "node:fs";
const panels = readFileSync("dist/webview/ui.js", "utf8");
const readme = readFileSync("README.md", "utf8");
const i = panels.indexOf("用户技能");
console.log({ panelHasDshUserSkills: i >= 0, gitImg: readme.includes("media/git.jpg") && readme.includes("media/git-2.jpg"), ver: readme.includes("0.12.89") });
if (i >= 0) console.log("ctx:", panels.slice(i - 60, i + 40).replace(/\n/g, " "));
