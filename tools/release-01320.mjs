// 发布 0.13.20:提交信息失败自证(诊断日志 + 未跟踪文件提示 + 空结果原因)。
import { readFileSync, writeFileSync } from "node:fs";
const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

const PREV = "0.13.19";
const ENTRY = `## 0.13.20
- "Generate commit message" no longer fails silently: ① the collected diff is logged with its source and size (\`staged changes (index vs HEAD)\` / \`unstaged changes (working tree vs index)\` · N chars), so the DSH output channel shows exactly what the command saw; ② when there is no diff at all the message distinguishes **untracked-only** changes — \`nothing to generate from — N untracked file(s) are not part of a git diff. Stage them (git add) and try again.\` — from a genuinely clean tree; ③ an empty model answer now reports why (\`turn end: {reason}, {events} events, {messages} assistant messages\`), which separates "the host blocked the turn" from "the model returned no text". All four new strings are localized in 14 languages.
- Verified end to end with the extension's own bundled code driving a real DSH 0.1.7-rc.2 server: a staged two-file diff produced \`feat: 新增 added.txt 并在 demo.txt 中追加内容\` in the SCM input box, the default model stayed \`deepseek-flash\` + \`max\` afterwards, and a repo with only untracked files produced the explanatory message instead of silence.`;

const ENTRY_ZH = `- 「一键生成提交信息」不再静默失败:① 采集到的 diff 会连同来源与规模写入日志(\`已暂存改动(index vs HEAD)\` / \`未暂存改动(工作区 vs index)\` · N 字符),DSH 输出通道里能直接看到命令到底看到了什么;② 完全没有 diff 时会区分**只有未跟踪文件**的情况——「没有可生成的内容——有 N 个未跟踪文件不属于 git diff,请先 git add 后重试」——而不是和「工作区干净」混为一谈;③ 模型没返回文本时会说明原因(\`回合结束原因:{reason},事件 N 条,助手消息 M 条\`),把「宿主 block 了回合」和「模型确实没输出」分开。四条新文案已补齐 14 种语言。
- 已用扩展自身打包代码驱动真实 DSH 0.1.7-rc.2 服务器做端到端验证:两文件已暂存 diff 生成 \`feat: 新增 added.txt 并在 demo.txt 中追加内容\` 写入 SCM 输入框,生成后默认模型仍为 \`deepseek-flash\` + \`max\`;只有未跟踪文件的仓库则给出明确说明而不是静默。`;

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
  const inserted = i >= 0 ? `${s.slice(0, i + marker.length)}\n${ENTRY.trim()}\n${ENTRY_ZH.trim()}\n${s.slice(i + marker.length)}` : `${marker}\n\n${ENTRY.trim()}\n`;
  writeFileSync(path, inserted, "utf8");
  console.log(`${f}: entry added`);
}
console.log(`released v${version}`);
