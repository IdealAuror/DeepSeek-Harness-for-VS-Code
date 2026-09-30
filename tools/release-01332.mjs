// 发布 0.13.32:修复权限下拉不可选(可选项应来自 permissionPresets/catalog,而非会话投影)。
import { readFileSync, writeFileSync } from "node:fs";
const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

const PREV = "0.13.31";
const ENTRY_EN = `## 0.13.32
- **Fixed the read/write permission dropdown being unusable.** The picker took its option list from the session's \`permissions\` projection, but that projection only carries the **current value** — in 0.2.0-rc.2 it is literally \`{"currentValue":"workspace-write"}\` with no \`options\` at all (measured on a live server). With an empty option list the pill's expand button was disabled, so nothing could be chosen. The extension now reads the option list from the process-level \`permissionPresets/catalog\` endpoint — exactly the split the official web client uses (\`selection = projection\`, \`catalog = options\`) — caches it per connection, and re-pushes the merged value once it arrives, at startup and on every session follow. If a host has no catalog endpoint, it falls back to whatever options the projection carries, so older deployments keep working. Verified live: catalog returns \`read-only / workspace-write / danger-full-access\` while the projection returns only the current value, and the merged result is a 3-option list.
- Permission descriptions are now localized through the host l10n bundles in all 14 languages instead of the previous Chinese text with an English-only mapping (the catalog's own English \`description\` stays as a fallback).`;

const ENTRY_ZH = `## 0.13.32
- **修复「读写权限」下拉无法选择的问题。** 下拉的选项列表原本取自会话的 \`permissions\` 投影,但该投影只携带**当前值** —— 在 0.2.0-rc.2 上实测它形如 \`{"currentValue":"workspace-write"}\`,完全没有 \`options\`。选项为空时胶囊的展开按钮是 disabled 状态,于是什么都选不了。现在选项改为取自进程级的 \`permissionPresets/catalog\` 端点 —— 与官方网页端完全相同的分工(\`selection = 投影\`、\`catalog = 目录\`)—— 按连接缓存一次,并在启动时与每次会话 follow 后把「目录选项 + 投影当前值」合并重推;宿主没有该端点时回退到投影自带 options,旧部署不受影响。已实测:目录返回 \`read-only / workspace-write / danger-full-access\` 而投影只有当前值,合并结果为 3 个可选项。
- 权限说明改为通过宿主 l10n 包本地化(14 种语言),不再是以往「中文写死 + 仅英文映射」的做法;目录自带的英文 \`description\` 作为兜底。`;

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
