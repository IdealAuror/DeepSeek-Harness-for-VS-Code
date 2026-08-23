// 用插件真实代码验证 GIT_INDEX_FILE 快照:真实索引不被触碰、无 index.lock 冲突。
import { mkdtempSync, writeFileSync, readFileSync, statSync, rmSync, mkdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { snapshotCommit } from "../plugins/dsh-git-rollback/lib/checkpoint.js";

const repo = mkdtempSync(join(tmpdir(), "dsh-locktest-"));
function git(args) {
  try {
    return execFileSync("git", ["-c", "core.quotepath=false", ...args], { cwd: repo, encoding: "utf8" });
  } catch (e) {
    return { error: e.stderr?.toString?.() ?? String(e) };
  }
}

console.log("== init repo ==");
git(["init", "-q"]);
git(["config", "user.name", "t"]);
git(["config", "user.email", "t@t"]);
writeFileSync(join(repo, "a.txt"), "hello\n");
git(["add", "-A"]);
git(["commit", "-qm", "init"]);
const headBefore = git(["rev-parse", "HEAD"]).trim();

console.log("== add an untracked file (worktree change) ==");
writeFileSync(join(repo, "b.txt"), "new\n");

// 模拟用户暂存:把 a.txt 修改后 add(真实索引状态)
writeFileSync(join(repo, "a.txt"), "hello world\n");
git(["add", "a.txt"]);
const indexTreeBefore = git(["write-tree"]).trim(); // 真实索引树(含 staged a.txt)
console.log("real index tree before:", indexTreeBefore.slice(0, 12));

console.log("== run checkpoint snapshotCommit ==");
const snap = await snapshotCommit("git", repo, headBefore, "dsh-checkpoint test");
console.log("snapshot:", snap.ok ? `commit=${snap.commit?.slice(0, 12)} tree=${snap.tree?.slice(0, 12)}` : `FAIL ${snap.reason}`);

console.log("== assert real index untouched ==");
const indexTreeAfter = git(["write-tree"]).trim();
console.log("real index tree after:", indexTreeAfter.slice(0, 12), indexTreeAfter === indexTreeBefore ? "(UNCHANGED ✓)" : "(CHANGED ✗)");
const stageStatus = git(["status", "--porcelain"]);
console.log("status:", stageStatus.replace(/\n/g, " | "));

// 快照树应包含 b.txt(worktree)且 a.txt = worktree 版本(hello world)
console.log("== assert snapshot tree has b.txt + modified a.txt ==");
const ls = git(["ls-tree", "-r", "--name-only", snap.tree]).trim();
console.log("snapshot files:", ls.replace(/\n/g, ", "), "(should include a.txt and b.txt)");
const aInSnap = git(["show", `${snap.tree}:a.txt`]);
const bInSnap = git(["show", `${snap.tree}:b.txt`]);
console.log("snapshot a.txt:", JSON.stringify(aInSnap.trim()), "(should be 'hello world')");
console.log("snapshot b.txt:", JSON.stringify(bInSnap.trim()), "(should be 'new')");

// 确认没有残留 index.lock
const lockExists = existsSync(join(repo, ".git", "index.lock"));
console.log("index.lock present:", lockExists, "(should be false)");

rmSync(repo, { recursive: true, force: true });
console.log("\nDONE");
