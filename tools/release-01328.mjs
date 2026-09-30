// 发布 0.13.28:实现 issue #20(输入框 ↑/↓ 调回历史输入)。
import { readFileSync, writeFileSync } from "node:fs";
const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

const PREV = "0.13.27";
const ENTRY_EN = `## 0.13.28
- **↑ / ↓ now recall previous inputs** in the composer, implementing [issue #20](https://github.com/NEXTINDIE/DeepSeek-Harness-for-VS-Code/issues/20): press ↑ to walk back through everything you have sent (like a shell), ↓ to walk forward, and ↓ past the newest entry (or Esc) restores the draft you were typing before you started browsing. Up to 50 entries are kept, consecutive duplicates are not stacked, and the history is persisted in the webview state so hiding or reloading the view keeps it.
- It never gets in the way of editing: ↑ only takes over with the caret at the start of the first line, or in a single-line input (where ↑/↓ have nothing to scroll); inside multi-line text the arrow keys still move the caret, an IME composition (Chinese/Japanese/Korean input) is never intercepted, and the mention (\`@\`) and slash (\`/\`) popups keep their own arrow-key navigation. Editing a recalled entry keeps your edit instead of having ↓ overwrite it, and a small \`历史 2/5\` pill appears next to the activity line while you browse.`;

const ENTRY_ZH = `## 0.13.28
- **输入框支持 ↑ / ↓ 调回之前发送过的内容**,实现 [issue #20](https://github.com/NEXTINDIE/DeepSeek-Harness-for-VS-Code/issues/20):\`↑\` 逐条回溯历史输入(与终端一致),\`↓\` 前进,越过最新一条(或按 \`Esc\`)即恢复进入历史前正在编辑的草稿。最多保留 50 条,连续重复不重复入栈;历史写入 webview 状态,视图隐藏或重载后仍在。
- 不干扰编辑:只有光标位于首行行首、或输入为单行(此时 ↑/↓ 本就没有可滚动的行)时才接管;多行文本中方向键仍只移动光标;输入法组合(中/日/韩输入)期间不拦截;\`@\` 提及与 \`/\` 命令弹层继续使用自己的方向键导航。调回后手动编辑的内容不会被 \`↓\` 覆盖,浏览历史时活动行右侧会出现 \`历史 2/5\` 小胶囊。`;

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
