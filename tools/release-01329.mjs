// 发布 0.13.29:诊断并修复「会话被其他 DSH 实例占用」的提示与会话占用提示条。
import { readFileSync, writeFileSync } from "node:fs";
const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

const PREV = "0.13.28";
const ENTRY_EN = `## 0.13.29
- **Diagnosed the \`session/writer-held\` failure** ("session … is already owned by an active write handle") that appears when the model is switched while another DSH instance is running. It is not a model bug and not specific to the desktop app: DSH sessions are owned by one writer at a time. Running two instances against the same DSH home (the desktop app plus \`dsh web\`, two \`dsh web\` processes, or the extension's auto-started server alongside either) means the instance that attached a session first keeps its write handle, and every write from the other one — switching the model, renaming, sending a message — is refused with that error. Reproduced deterministically with two independent servers over one isolated home: \`selectModel\`, \`renameSession\` and \`sendPromptParts\` all come back \`code=session/writer-held\`.
- **The extension now explains it instead of showing the raw error**: a write refused with \`session/writer-held\` is reported as "this session is held by another running DSH instance (the desktop app or another dsh web) — switch to another session, or quit that instance and retry", in all 14 languages, and a persistent notice bar appears above the composer for as long as that session is locked. The bar clears by itself as soon as any write to the session succeeds (for example after quitting the other instance). The same handling covers model switching, renaming and sending.`;

const ENTRY_ZH = `## 0.13.29
- **定位了 \`session/writer-held\` 报错**("session … is already owned by an active write handle",切换模型时出现的那个)。它既不是模型的问题,也不专属于桌面端:**DSH 的会话同一时刻只允许一个写入方**。当同一 DSH 主目录下同时跑着两个实例(桌面端 + \`dsh web\`、两个 \`dsh web\`,或扩展自动启动的服务器与其中任一个并存)时,先挂上该会话的一方持有写句柄,另一方的所有写操作 —— 切换模型、重命名、发送消息 —— 都会收到这个错误。已用「同一隔离主目录 + 两个独立服务器进程」稳定复现:\`selectModel\`、\`renameSession\`、\`sendPromptParts\` 全部返回 \`code=session/writer-held\`。
- **扩展改为解释清楚,而不是抛原始报错**:凡因 \`session/writer-held\` 被拒的写操作,都会提示「当前会话已被其他正在运行的 DSH 实例占用(桌面端或另一个 dsh web),请在 VS Code 里换一个会话,或退出该实例后重试」(14 种语言),同时在输入框上方显示常驻提示条;只要该会话任意一次写操作成功(例如退出另一端后),提示条会自动消失。切模型、重命名、发送消息三条路径都已覆盖。`;

const pkgPath = `${root}package.json`;
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const [a, b, c] = pkg.version.split(".").map(Number);
const version = `${a}.${b}.${c + 1}`;
pkg.version = version;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");

let readme = readFileSync(`${root}README.md`, "utf8");
readme = readme.split(`Latest: ${PREV}`).join(`Latest: ${version}`).split(`最新版本:${PREV}`).join(`最新版本:${version}`);
// 英文:故障排查补一条
readme = readme.split("## Troubleshooting").join(`## Troubleshooting

- **"This session is already in use" / \`session/writer-held\`**: a DSH session can only be written by one instance at a time. Quit the other instance that has it attached (the desktop app, another \`dsh web\`, or a second VS Code window driving the same server), or simply switch to another session in VS Code — then the notice bar above the composer disappears and model switching, renaming and sending work again.`);
// 中文
readme = readme.split("## 故障排查").join(`## 故障排查

- **「当前会话已被占用」/ \`session/writer-held\`**:DSH 的会话同一时刻只允许一个实例写入。请退出已挂载该会话的另一端(桌面端、另一个 \`dsh web\`,或驱动同一服务器的另一个 VS Code 窗口),或在 VS Code 里直接换一个会话 —— 输入框上方的占用提示条会自动消失,切模型 / 重命名 / 发送即可恢复。`);
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
