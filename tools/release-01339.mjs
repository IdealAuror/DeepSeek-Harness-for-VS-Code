// 发布 0.13.39:手动添加的附件与图片可点击查看。
import { readFileSync, writeFileSync } from "node:fs";
const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

const PREV = "0.13.38";
const ENTRY_EN = `## 0.13.39
- Attachments in the composer are now clickable: clicking a **file** chip opens it (text-like files in the editor with the usual HEAD→worktree diff for tracked files, images/PDF/archives/executables through the VS Code viewer instead of the old "open a PNG as text" path), clicking a **folder** chip reveals it in the file explorer, and clicking an **image** chip opens a full-size preview (Escape or clicking the backdrop closes it, with "open with the default app" saving it to a temp file first). Right-clicking a file/folder chip offers View file / Open with default app / Reveal in File Explorer / Remove attachment; the × still removes only and never opens anything. The chips show a pointer cursor and underline their label on hover so they read as clickable.
- Root cause of the old behaviour: \`openFile\` always went through \`openTextDocument\`, so a binary attachment either errored or was shown as text; the host now classifies by extension (\`isTextLikePath\`) and routes non-text files to \`vscode.open\`.
- Tests kept in the repo: \`tools/test-open-routing.mjs\` (20 extension→route assertions) and a jsdom interaction harness covering file/folder/image clicks, the right-click menu, remove-only behaviour and the preview overlay. All new strings are localized in 14 languages.`;

const ENTRY_ZH = `- 输入区的附件现在可点击查看:点**文件**芯片即打开(文本类走编辑器、已跟踪文件仍是 HEAD→工作区 diff;图片/PDF/压缩包/可执行文件改走 VS Code 默认查看器,不再出现「把 PNG 当文本打开」的老问题),点**文件夹**芯片在资源管理器中定位,点**图片**芯片打开原尺寸预览(Esc 或点遮罩关闭,弹层内「用默认应用打开」会先把图片写成临时文件)。文件/文件夹芯片右键给出 查看文件 / 用默认应用打开 / 在资源管理器中显示 / 移除附件;× 依旧只移除、绝不触发打开。芯片加了指针光标,悬停时文件名会加下划线,一眼看出可点。
- 旧行为的原因:\`openFile\` 一律走 \`openTextDocument\`,二进制附件要么报错、要么被当文本显示;宿主现在按扩展名判定(\`isTextLikePath\`),非文本文件交给 \`vscode.open\`。
- 测试留在仓库:\`tools/test-open-routing.mjs\`(20 条扩展名→路由断言)+ 一份 jsdom 交互夹具(文件/文件夹/图片点击、右键菜单、只移除不打开、预览弹层开关)。所有新文案已补齐 14 种语言。`;

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
  const inserted = i >= 0 ? `${s.slice(0, i + marker.length)}\n${ENTRY_EN.trim()}\n${ENTRY_ZH.trim()}\n\n${s.slice(i + marker.length)}` : `${marker}\n\n${ENTRY_EN.trim()}\n`;
  writeFileSync(path, inserted, "utf8");
  console.log(`${f}: entry added`);
}
console.log(`released v${version}`);
