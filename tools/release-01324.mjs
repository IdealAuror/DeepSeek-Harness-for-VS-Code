// 发布 0.13.24:活动栏/辅助侧栏容器改用可爱风单色虎鲸 SVG 图标;Cordis 按钮恢复拼图 emoji。
import { readFileSync, writeFileSync } from "node:fs";
const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

const PREV = "0.13.23";
const ENTRY_EN = `## 0.13.24
- The VS Code container icon is now a hand-drawn **cute orca** (\`media/orca.svg\`) instead of the previous square logo, on both the Activity Bar container and the Secondary Side Bar container (and for the chat view's own icon). It is drawn as a black silhouette with the eye patches and mouth left as negative space, which is exactly how VS Code renders container icons - it masks the SVG by alpha and paints it with \`activityBar.inactiveForeground\` / the hover foreground - so the orca follows light, dark and high-contrast themes automatically at any DPI. The Marketplace extension icon (\`media/icon.png\`) is unchanged.
- The Cordis plugin button goes back to its 🧩 emoji as requested (the drawn puzzle icon added in 0.13.22 was removed; the Automation-tasks alarm clock and Subagent-catalog robot line icons stay).`;

const ENTRY_ZH = `- VS Code 容器图标从原来的方形 logo 换成手绘的**可爱风虎鲸**(\`media/orca.svg\`):活动栏容器、辅助侧栏容器以及聊天视图自身的图标都用它。图形以纯黑剪影 + 眼斑/嘴巴留白绘制 —— 这正是 VS Code 渲染容器图标的方式(按 alpha 蒙版,再用 \`activityBar.inactiveForeground\` / 悬停前景色着色),因此虎鲸会自动跟随浅色 / 深色 / 高对比主题,任意 DPI 都清晰。市场展示用的扩展图标(\`media/icon.png\`)保持不变。
- 按要求把 **Cordis 插件按钮恢复为 🧩 emoji**(撤销 0.13.22 里换上的手绘拼图图标);自动化任务的闹钟图标与子代理目录的机器人图标保留为线条图标。`;

const pkgPath = `${root}package.json`;
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const [a, b, c] = pkg.version.split(".").map(Number);
const version = `${a}.${b}.${c + 1}`;
pkg.version = version;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");

let readme = readFileSync(`${root}README.md`, "utf8");
readme = readme.split(`Latest: ${PREV}`).join(`Latest: ${version}`).split(`最新版本:${PREV}`).join(`最新版本:${version}`);
writeFileSync(`${root}README.md`, readme, "utf8");

for (const f of ["CHANGELOG.md", ".dsh/agent/extension-changelog.md"]) {
  const path = `${root}${f}`;
  const s = readFileSync(path, "utf8");
  const marker = f === "CHANGELOG.md" ? "# Changelog\n\n" : "# dsh-vscode Changelog";
  const i = s.indexOf(marker);
  const entry = `${ENTRY_EN.trim()}\n${ENTRY_ZH.trim()}`;
  const inserted = i >= 0 ? `${s.slice(0, i + marker.length)}\n${entry}\n${s.slice(i + marker.length)}` : `${marker}\n\n${entry}\n`;
  writeFileSync(path, inserted, "utf8");
  console.log(`${f}: entry added`);
}
console.log(`released v${version}`);
