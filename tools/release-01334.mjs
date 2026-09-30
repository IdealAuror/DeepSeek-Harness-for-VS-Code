// 发布 0.13.34:提交消息生成后默认模型可能停在提交档 —— 恢复改为可验证 + 失败可见。
import { readFileSync, writeFileSync } from "node:fs";
const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

const PREV_MATCH = /Latest: [\d.]+/;
const pkgPath = `${root}package.json`;
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const [a, b, c] = pkg.version.split(".").map(Number);
const version = `${a}.${b}.${c + 1}`;
pkg.version = version;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");

const ENTRY_EN = `## ${version}
- **Generate Commit Message can no longer leave your default model on the commit setting.** Diagnosis first: \`session/selectModel\` does two separate things — it installs the model for that session's next request **and** saves the profile default in the background (the host logs a failed background save to its own log, where the extension cannot see it). The existing restore already worked on the happy path (verified end-to-end against 0.2.0-rc.2: user \`v4-pro/max\` → commit \`flash/low\` → restored \`v4-pro/max\` in the profile), so the remaining holes were the paths where the restore is *silent*: (1) if the original selection could not be read, the extension switched the model anyway and had nothing to restore with — it now refuses to switch at all in that case; (2) a failed restore was only written to the console — it now reads the selection back, retries once, and shows a warning naming the model it could not restore; (3) \`reasoningEffort\` comparison and capture are now case-insensitive and drive an explicit "did my restore take effect" check, so an effort-only difference can no longer slip through.
- Also fixed the reasoning-effort gate: a model whose reasoning efforts are declared by \`name\` (ids empty, as some upload probes do) no longer loses the configured effort — it is treated as supporting it, matching how the web client renders efforts.
- Regression: \`tools/test-commit-model-restore.mjs\` (9 checks over the capture/restore logic) plus a live end-to-end pass (\`tmp/probe-commit-flow-e2e.mjs\`) asserting the profile ends on the user's original selection.`;

const ENTRY_ZH = `## ${version}
- **「生成提交消息」不会再把你的默认模型留在提交档上。** 先给诊断结论:宿主 \`session/selectModel\` 做的是两件事 —— 把模型装到该会话的下一次请求,**同时**在后台保存 profile 默认值(后台保存失败只写进宿主自己的日志,扩展看不到)。原有恢复在正常路径上是对的(已对 0.2.0-rc.2 端到端实测:用户 \`v4-pro/max\` → 提交档 \`flash/low\` → profile 恢复为 \`v4-pro/max\`),所以剩下的漏洞都在「恢复是静默的」这条路径上:① 读不到原值时代码仍会切换模型、却没有东西可恢复 —— 现在这种情况直接不切换;② 恢复失败只写 console —— 现在会读回校验、重试一次,仍失败就弹告警并写明无法恢复的模型;③ \`reasoningEffort\` 的比较与捕获改为大小写无关,并作为「恢复是否真的生效」的判定依据,只差思考深度的情况不会再漏过。
- 同时修掉思考深度判定:能力只以 \`name\` 声明(ids 为空,部分上传探测如此)的模型不再丢掉配置的思考深度,而是按「支持」处理,与网页端渲染一致。
- 回归:\`tools/test-commit-model-restore.mjs\`(捕获/恢复逻辑 9 项)+ 真实端到端(\`tmp/probe-commit-flow-e2e.mjs\`)断言 profile 最终等于用户原选择。`;

let readme = readFileSync(`${root}README.md`, "utf8");
readme = readme.replace(PREV_MATCH, `Latest: ${version}`).replace(/最新版本:[\d.]+/, `最新版本:${version}`);
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
