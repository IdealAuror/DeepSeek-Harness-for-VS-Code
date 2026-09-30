// 发布 0.13.31:补齐 PTC 预设(DSH 0.2.0 内置 code → ptc)的名称与说明,并同步四段预设文案。
import { readFileSync, writeFileSync } from "node:fs";
const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

const PREV = "0.13.30";
const ENTRY_EN = `## 0.13.31
- **Fixed the blank \`ptc\` entry in the Agent-preset dropdown.** DSH 0.2.0 renamed its built-in preset \`code\` → \`ptc\`, and \`agentPresets/list\` publishes only \`id\`/\`order\`/\`isDefault\` for shipped presets — the name and description come from the client's own dictionary. The extension's built-in table still listed \`code\`, so \`ptc\` fell through to the raw id with no description. \`ptc\` is now a first-class entry ("PTC 模式" / "PTC mode") with its description, the old \`code\` id is kept as an alias for older deployments, and the copy for all four shipped presets was refreshed to match DSH 0.2.0's own wording (standard / ptc / minimal / cordis) in all 14 languages.
- Verified against a live 0.2.0-rc.2 roster (\`{"presets":[{"id":"standard","isDefault":true},{"id":"ptc"},{"id":"minimal"},{"id":"cordis"}]}\`): every row now renders a name **and** a description in zh-cn, en and ja.`;

const ENTRY_ZH = `## 0.13.31
- **修复 Agent 预设下拉里「ptc」只有名字、没有说明的问题。** DSH 0.2.0 把内置预设 \`code\` 改名为 \`ptc\`,而 \`agentPresets/list\` 对内置预设只下发 \`id\`/\`order\`/\`isDefault\` —— 名称与说明来自客户端词典。扩展的内置表里还是 \`code\`,于是 \`ptc\` 落到了「用原始 id 当名字、且没有说明」的回退分支。现在 \`ptc\` 已是正式条目(「PTC 模式」/「PTC mode」)并带上说明;旧 id \`code\` 保留为别名以兼容旧部署;四个内置预设(标准 / PTC / 极简 / 创造)的文案也同步到 DSH 0.2.0 官方措辞,覆盖全部 14 种语言。
- 已用真实 0.2.0-rc.2 的 roster 实测(\`{"presets":[{"id":"standard","isDefault":true},{"id":"ptc"},{"id":"minimal"},{"id":"cordis"}]}\`):zh-cn、en、ja 三种语言下四行都能显示**名称 + 说明**。`;

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
