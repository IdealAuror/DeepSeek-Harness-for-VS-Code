/**
 * 修复版本号冲突:另一个会话已用 0.13.32 发布了 issue #19 的修复,
 * 本会话的「权限下拉」修复改为 0.13.33,并修掉 CHANGELOG 里被交错插入的重复标题。
 */
import { readFileSync, writeFileSync } from "node:fs";
const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

const MINE_EN = "- **Fixed the read/write permission dropdown being unusable.**";
const MINE_ZH = "- **修复「读写权限」下拉无法选择的问题。**";

for (const f of ["CHANGELOG.md", ".dsh/agent/extension-changelog.md"]) {
  const path = `${root}${f}`;
  const lines = readFileSync(path, "utf8").split(/\r?\n/);

  // 1) 收集本会话的两段(EN/ZH)内容
  const mine = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith(MINE_EN) || lines[i].startsWith(MINE_ZH)) {
      mine.push(lines[i]);
      lines[i] = "\u0000REMOVED\u0000";
    }
  }
  // 2) 删掉因此变空的重复标题(标题后紧跟被移除的行)
  const cleaned = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === "\u0000REMOVED\u0000") continue;
    if (/^## 0\.13\.32/.test(line)) {
      // 若该标题下已无任何正文(下一行也是标题或为空),则丢弃
      const next = lines.slice(i + 1).find((l) => l !== "\u0000REMOVED\u0000" && l.trim() !== "");
      if (next === undefined || next.startsWith("## ")) continue;
    }
    cleaned.push(line);
  }
  // 3) 把本会话内容作为 0.13.33 插到最前
  const marker = f === "CHANGELOG.md" ? "# Changelog" : "# dsh-vscode Changelog";
  const at = cleaned.findIndex((l) => l.startsWith(marker));
  const entry = [`## 0.13.33`, ...mine, ""];
  const out = at >= 0 ? [...cleaned.slice(0, at + 1), "", ...entry, ...cleaned.slice(at + 1)] : [...entry, ...cleaned];
  writeFileSync(path, out.join("\n").replace(/\n{4,}/g, "\n\n\n"), "utf8");
  console.log(`${f}: 权限修复已归入 0.13.33`);
}

let readme = readFileSync(`${root}README.md`, "utf8");
readme = readme.replace(/Latest: 0\.13\.32/, "Latest: 0.13.33").replace(/最新版本:0\.13\.32/, "最新版本:0.13.33");
writeFileSync(`${root}README.md`, readme, "utf8");
console.log("README 版本 → 0.13.33");
