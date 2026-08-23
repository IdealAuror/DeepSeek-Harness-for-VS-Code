// 语法检查插件 JS + 同步到 resources(发布源)。
import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const files = ["git.js", "checkpoint.js", "rollback.js"];
const pluginLib = "plugins/dsh-git-rollback/lib/";
const resLib = "resources/dsh-git-rollback/lib/";

for (const f of files) {
  const r = spawnSync(process.execPath, ["--check", pluginLib + f], { encoding: "utf8" });
  console.log((r.status === 0 ? "OK  " : "FAIL") + " plugins/" + f + (r.status !== 0 ? "\n" + (r.stderr || r.stdout) : ""));
}

for (const f of files) {
  const src = readFileSync(pluginLib + f);
  writeFileSync(resLib + f, src);
  const r = spawnSync(process.execPath, ["--check", resLib + f], { encoding: "utf8" });
  console.log((r.status === 0 ? "OK  " : "FAIL") + " resources/" + f + (r.status !== 0 ? "\n" + (r.stderr || r.stdout) : ""));
}
console.log("synced to resources/");
