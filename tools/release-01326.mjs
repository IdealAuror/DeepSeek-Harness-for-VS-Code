// 发布 0.13.26:侧栏图标换成线条机器人(media/robot.svg)。
import { readFileSync, writeFileSync } from "node:fs";
const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

const PREV = "0.13.25";
const ENTRY_EN = `## 0.13.26
- The sidebar icon is now the **line robot** (\`media/robot.svg\`) instead of the orca: a rounded head outline with a short antenna and two bar eyes, drawn with the same stroke weight and rounded joins as the extension's own toolbar icons. It is used for the Activity Bar container, the Secondary Side Bar container and the chat view icon (the Marketplace logo \`media/icon.png\` is untouched).
- Because the mark is a monochrome outline with no fills, VS Code's container-icon treatment (mask by alpha, paint with \`activityBar.inactiveForeground\` / the hover foreground) keeps it crisp and correctly coloured on light, dark and high-contrast themes at any DPI; the previous orca mark stays in the repo as \`media/orca.svg\` but is no longer referenced.`;

const ENTRY_ZH = `- 侧栏图标从虎鲸换成**线条机器人**(\`media/robot.svg\`):圆角头框 + 短天线 + 两条竖条眼睛,描边粗细与圆角收笔与扩展自身工具栏图标一致。活动栏容器、辅助侧栏容器与聊天视图图标都使用它(市场展示用的 \`media/icon.png\` 不变)。
- 由于这枚标记是纯描边、无填充,VS Code 对容器图标的处理方式(按 alpha 蒙版 + 用 \`activityBar.inactiveForeground\` / 悬停前景色重绘)能让它在浅色 / 深色 / 高对比主题、任意 DPI 下都保持清晰且配色正确;上一版虎鲸保留在仓库里(\`media/orca.svg\`)但已不再被引用。`;

const pkgPath = `${root}package.json`;
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const [a, b, c] = pkg.version.split(".").map(Number);
const version = `${a}.${b}.${c + 1}`;
pkg.version = version;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");

let readme = readFileSync(`${root}README.md`, "utf8");
readme = readme.split(`Latest: ${PREV}`).join(`Latest: ${version}`).split(`最新版本:${PREV}`).join(`最新版本:${version}`);
readme = readme
  .split("the Activity Bar / Secondary Side Bar container uses a minimal DeepSeek-style orca mark in brand blue (media/orca.svg, masked to the theme icon colour by VS Code)")
  .join("the Activity Bar / Secondary Side Bar container and the chat view use a line-robot mark (media/robot.svg, masked to the theme icon colour by VS Code)")
  .split("活动栏 / 辅助侧栏容器改用 DeepSeek 风格极简虎鲸标志(品牌蓝 media/orca.svg,由 VS Code 按主题图标色蒙版着色)")
  .join("活动栏 / 辅助侧栏容器与聊天视图改用线条机器人图标(media/robot.svg,由 VS Code 按主题图标色蒙版着色)");
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
