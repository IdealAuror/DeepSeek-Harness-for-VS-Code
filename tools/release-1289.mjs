// 发布 0.12.89:设置项多语言化 + README 回退截图 + 插件描述更新。
import { readFileSync, writeFileSync } from "node:fs";
const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

const EN = `## 0.12.89
- i18n & description: ① the settings-panel "DSH 用户技能" toggle label now uses the UI translation table (was hardcoded Chinese), so it follows the VS Code display language like every other setting; ② README (the extension description page) now embeds two git-rollback screenshots at the feature descriptions — the "Undo turn's changes" review dialog and the message-action menu (Undo this turn's file changes / View checkpoints / Branch from here) — and the turn-level Git rollback feature bullet was expanded to cover the per-turn undo and checkpoint review; ③ the short plugin description (package.json + all 14 localized package.nls) was refreshed to mention @ file/session/agent mentions, multimodal images, subagents, Cordis plugin approvals, and turn-level Git rollback.
- 多语言化与描述:① 设置面板的「DSH 用户技能」开关标签改为走界面翻译词典(原先硬编码中文),现在与其他设置一样跟随 VS Code 显示语言;② README(即插件描述页)在对应功能描述处嵌入两张 git 回退截图 —— 「撤销本回合改动」审核弹窗 与 消息操作菜单(撤销本回合改动 / 查看检查点 / 从此处新建分支),并扩充回合级 Git 回退条目,涵盖单回合撤销与检查点查看;③ 插件短描述(package.json + 14 份本地化 package.nls)更新,提及 @ 文件/会话/智能体提及、多模态图片、子代理、Cordis 插件审批与回合级 Git 回退。`;

const pkgPath = `${root}package.json`;
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const [a, b, c] = pkg.version.split(".").map(Number);
const version = `${a}.${b}.${c + 1}`;
pkg.version = version;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");

// README 版本号(英文/中文两处 Latest)
let readme = readFileSync(`${root}README.md`, "utf8");
readme = readme.split("Latest: 0.12.88").join(`Latest: ${version}`).split("最新版本:0.12.88").join(`最新版本:${version}`);
writeFileSync(`${root}README.md`, readme, "utf8");

for (const f of ["CHANGELOG.md", ".dsh/agent/extension-changelog.md"]) {
  const path = `${root}${f}`;
  const s = readFileSync(path, "utf8");
  const marker = f === "CHANGELOG.md" ? "# Changelog\n\n" : "# dsh-vscode Changelog";
  const i = s.indexOf(marker);
  const inserted = i >= 0 ? `${s.slice(0, i + marker.length)}\n${EN.trim()}\n${s.slice(i + marker.length)}` : `${marker}\n\n${EN.trim()}\n`;
  writeFileSync(path, inserted, "utf8");
  console.log(`${f}: entry added`);
}
console.log(`released v${version}`);
