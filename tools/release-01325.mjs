// 发布 0.13.25:容器图标改为 DeepSeek 风格的极简虎鲸(品牌蓝 #4D6BFE)。
import { readFileSync, writeFileSync } from "node:fs";
const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

const PREV = "0.13.24";
const ENTRY_EN = `## 0.13.25
- The container icon (\`media/orca.svg\`) is redrawn in a **DeepSeek-style minimal** treatment: one brand-blue fill (DeepSeek blue \`#4D6BFE\`), no outlines or gradients, built from a round body + an upswept thick tail with a two-lobed fluke + a backswept dorsal fin + a pectoral flipper, with the orca's eye patch left as negative space (a white patch around a blue pupil). At the 16px Activity Bar size it reads as a whale in silhouette; in the view title it reads as a blue orca.
- How it renders: VS Code masks container icons by alpha and paints them with \`activityBar.inactiveForeground\` (hover foreground when active), so in the Activity Bar you get the theme-coloured silhouette and the negative-space eye patch stays legible on light, dark and high-contrast themes; the same file is used for the chat view icon and the Secondary Side Bar container. The Marketplace icon (\`media/icon.png\`) is unchanged.`;

const ENTRY_ZH = `- 容器图标(\`media/orca.svg\`)改为 **DeepSeek 风格极简**处理:单一品牌蓝填充(DeepSeek 蓝 \`#4D6BFE\`)、无描边无渐变,由「浑圆身体 + 上扬粗尾与二叶尾鳍 + 后掠背鳍 + 胸鳍」构成,虎鲸眼斑作为留白(白色眼斑中一颗蓝色瞳孔)。在活动栏 16px 尺寸下读出鲸形剪影,在视图标题里则是一条蓝色虎鲸。
- 渲染原理:VS Code 会把容器图标按 alpha 取蒙版、再用 \`activityBar.inactiveForeground\`(激活时用 hover 前景色)着色,所以活动栏里是主题色剪影、留白眼斑在浅色/深色/高对比主题下都清晰;同一份文件同时用于聊天视图图标与辅助侧栏容器。市场展示图标(\`media/icon.png\`)不变。`;

const pkgPath = `${root}package.json`;
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const [a, b, c] = pkg.version.split(".").map(Number);
const version = `${a}.${b}.${c + 1}`;
pkg.version = version;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");

let readme = readFileSync(`${root}README.md`, "utf8");
readme = readme.split(`Latest: ${PREV}`).join(`Latest: ${version}`).split(`最新版本:${PREV}`).join(`最新版本:${version}`);
readme = readme.split(
  "the Activity Bar / Secondary Side Bar container uses a cute monochrome orca icon (media/orca.svg)",
).join(
  "the Activity Bar / Secondary Side Bar container uses a minimal DeepSeek-style orca mark in brand blue (media/orca.svg, masked to the theme icon colour by VS Code)",
);
readme = readme.split(
  "活动栏 / 辅助侧栏容器改用可爱风单色虎鲸图标(media/orca.svg)",
).join(
  "活动栏 / 辅助侧栏容器改用 DeepSeek 风格极简虎鲸标志(品牌蓝 media/orca.svg,由 VS Code 按主题图标色蒙版着色)",
);
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
