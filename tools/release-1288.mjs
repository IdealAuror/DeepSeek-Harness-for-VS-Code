// 发布 0.12.88:修复 index.lock 冲突(文案避免反引号)。
import { readFileSync, writeFileSync } from "node:fs";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const EN = `## 0.12.88
- Fix "index.lock: File exists" conflicts that made commits/sync fail after generating a commit message: the rollback plugin's automatic checkpoint snapshot (taken at every turn start/end — including the turn created when generating a commit message) used to run "git add -A" + "git write-tree" + "git read-tree" against the real .git/index, repeatedly acquiring .git/index.lock and colliding with your own "git add"/"git commit"/sync. Now the checkpoint and savepoint snapshots stage into an isolated temporary index (GIT_INDEX_FILE) and leave your real index untouched — verified: the snapshot keeps your staged state, never touches .git/index, and leaves no index.lock. All read-only git commands (status/diff/ls-files/rev-parse) in both the extension and the plugin now run with GIT_OPTIONAL_LOCKS=0 so they no longer refresh or lock the index; the actual rollback/undo index writes (read-tree/reset, user-triggered) retry briefly on an index.lock contention.
- 修复用插件生成提交消息后 git add/同步报 index.lock 冲突的问题:回退插件的自动检查点快照(每回合开始/结束执行,包含生成提交消息时创建的那一回合)原先对真实 .git/index 执行 "git add -A" + "git write-tree" + "git read-tree",反复获取 .git/index.lock,与你自己的 git add/commit/同步互踩。现在检查点与保存点快照改用独立临时索引(GIT_INDEX_FILE),完全不触碰你的真实索引 —— 已实测:快照保留你的暂存状态、不改 .git/index、无 index.lock 残留。扩展与插件中的所有只读 git 命令(status/diff/ls-files/rev-parse)现以 GIT_OPTIONAL_LOCKS=0 运行,不再刷新或锁定索引;真正的回退/撤销索引写入(read-tree/reset,用户触发)在遇到 index.lock 争用时短暂重试。`;

const pkgPath = `${root}package.json`;
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const [a, b, c] = pkg.version.split(".").map(Number);
const version = `${a}.${b}.${c + 1}`;
pkg.version = version;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");

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
