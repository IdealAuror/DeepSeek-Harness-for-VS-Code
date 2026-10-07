# dsh-vscode (local fork)

[`NEXTINDIE/DeepSeek-Harness-for-VS-Code`](https://github.com/NEXTINDIE/DeepSeek-Harness-for-VS-Code)
的本地 fork，目前承载修复 1–5（详见 `CHANGELOG.md` 与下文）。

- 上游 issue：[#22 缓存命中恒显示 100%](https://github.com/NEXTINDIE/DeepSeek-Harness-for-VS-Code/issues/22)
- 其余修复（服务器生命周期、压缩行、插队消息分段、跟随流重挂）尚未提 issue

| | 上游 | 本 fork |
|---|---|---|
| 扩展 ID | `Jager.dsh-vscode` | `IdealAuror.dsh-vscode` |
| 版本 | 0.13.43 | 0.13.44 |
| 显示名 | DeepSeek Harness for VS Code | … (local fix) |
| 适配的内核 | 0.1.x | 0.2.0-rc.2（`@deepseek-ai/dsh@latest`） |

publisher 决定扩展 ID，改了才能与上游并存、互不覆盖；版本号高于上游，避免 VS Code 当成回退。

---

## 修复 1：Token 胶囊「缓存命中」恒显示 100%

**根因**：`src/webview/ui.ts` 的 `cacheHitPercentText()` 有一条与本函数文档相矛盾的快捷分支：

```ts
if (promptTokens - cacheReadTokens <= 0) return "100";   // 已删除
```

任何 `cacheReadTokens >= promptTokens` 的输入都会被**无条件断言成 100%**，不做一致性校验。
窗口内只剩高命中的近期请求、或分母取自小于缓存读取的子集时，就会落进这一条。

值得注意的是：**上游仓库里本来就有一个测试在断言相反的行为**（`tools/test-compaction-row.mjs`）：

```js
check("部分命中 99.6% 不被进位成 100%", ...);
check("极接近 100% 时提高精度", ...);
check("完全命中显示 100%", ...);
```

也就是说这个快捷分支一直让上游自己的测试失败。本 fork 让实现符合它自己的测试。

**改动**：

```ts
const ratio = cacheReadTokens / Math.max(promptTokens, cacheReadTokens);
```

删掉快捷分支后一律走比例计算：真实满命中仍显示 `100`，部分命中显示带小数的真实值。
分母取下限是防止输入不一致时算出 >100%。

### 残留（未修）

修好后仍可能与原生端差约 1 个百分点（如插件 99% vs 原生 98%）。
那是另一个问题：插件用 `HISTORY_PAGE_MESSAGES = 60`（`src/dsh/hub.ts`）只拉 60 条消息，
投影到达前/重绘后由 `deriveStatsFromEvents()` 在这个窗口上求和（0.13.38 为「回合进行中也能看到胶囊」而引入）。
口径偏窄、天生偏高。彻底修需要改数据来源，改动面较大，留给上游。

---

## 修复 2：本机已有 DSH 服务器时，扩展把自己撞死

**症状**：扩展激活正常，但侧边栏/聊天面板出不来；输出通道里是 `EBUSY`。

**触发条件**：`127.0.0.1:3080` 上已经有一个 **不是本扩展启动的** DSH 服务器
（例如 DSH 桌面端，或用户自己在终端跑了 `dsh web`）。

**根因**（两条独立的缺陷叠加）：

1. `ServerManager.ensure()` 只要探测到「有 HTTP 响应」就 `return { up: true }`。
   它虽然调了 `refreshLaunchToken()`，但**没检查是否真的拿到了 token**。
   0.1.2 起 `/api` 需要签名 cookie，所以「在线但无 token」是个**静默失败**——
   这里报成功，后面 `ping()` 才以 `DshAuthError` 失败。

2. 于是扩展转去启动自己的实例，而 `start()` 会先 `unlinkSync(logFile)` 再 `openSync`。
   Windows 上外部服务器仍持有 `%TEMP%\dsh-vscode-server.log` 的句柄：`unlinkSync` 抛错被
   `catch {}` **静默吞掉**，随后的 `openSync` 抛 `EBUSY`——而它发生在 `try` 块之外，
   所以既没变成可读的失败原因，也没有进入 spawn 的错误分支。

**日志证据**（`%TEMP%\dsh-vscode-server.log` 与 VS Code 输出通道）：

```
[status] serverUp=true muxConnected=false ... 服务器要求授权(0.1.2 起 /api 需要签名 cookie),
         但未取得启动 token:请先停止本机运行中的 dsh 服务器,再由本扩展重新启动(会自动获取授权)。
[activate] 启动流程异常: Error: EBUSY: resource busy or locked,
         open 'C:\Users\lenovo\AppData\Local\Temp\dsh-vscode-server.log'
    at ServerManager.start (...\dist\extension.js:4645:44)
```

**改动**（`src/dsh/serverManager.ts`）：

1. 新增 `requiresExternalToken()`：探测 401。401 既证明服务器在，也证明它不会接受无 token 的请求
   （旧版 0.1.1- 返回 200/303，不需要 token，行为不变）。

2. `ensure()` 在「服务器在线 + 无 token + 确实要授权」时**直接失败并给出可操作提示**，
   不再去启动必然失败的第二个实例。因为 `ensure().up === false` 时
   `DshHub.doEnsureReady()` 会走 `deps.onNotice(msg, "error")`，所以这条提示**用户真的能看到**，
   而不是像上游那样把原因埋在输出通道里。

3. `start()` 里把日志文件的 `unlink`/`open` 失败变成带原因的可诊断错误（新增 `hub.serverLogLocked`），
   不再让 `EBUSY` 从 `try` 块外逸出。

新增 i18n 键 `hub.serverForeignNoToken` / `hub.serverLogLocked`，已补齐全部 14 个语言包。

### 行为取舍

「服务器在线但要授权而我们没有 token」时选择**失败并提示**，而不是猜测或强行接管：
- 全部放行会退回原来的静默失败路径；
- 强杀外部服务器会毁掉用户自己的 DSH 会话（例如桌面端正在跑的对话）。

注意 DSH 服务端与 VS Code 扩展都要 `127.0.0.1:3080`，**同时只能用一个**。日常一次只用一个不会碰到。

### 未验证的部分

这两处修复**尚未在真实故障条件下实测**：触发它需要杀掉承载当前 DSH 会话的服务端。
已做的是代码路径核验 + 构建产物核验 + 既有测试回归。真正的验证要等下次
「DSH 服务端已在跑，再打开 VS Code 扩展」时，确认拿到的是那条可操作提示而不是 `EBUSY`。

---

## 修复 3：压缩（/compact）之后，对话里压缩点以上的内容整段消失

### 症状

执行 `/compact` 后，VS Code 面板里只剩一条 `compact · 已压缩 N 条历史记录`，
上面的历史**全部不见**；刷新网页端（`http://127.0.0.1:3080`）却仍在。

### 证据（实测，不是推测）

持久日志 `~/.dsh/sessions/<ws>/session-*/session.v3.jsonl.zstd` 里 1651 条记录一条没少，
压缩事务在 seq 1577–1580，检查点记录长这样：

```
user/message seq=1579
  source    = {kind:"plugin", plugin:"compact", compactionId:"53316c66-…", sourceCommandId:"cmd-1b3c16b6-3"}
  surfaceOp = {"op":"replace","startSeq":9,"endSeq":1564}
```

`surfaceOp=replace` 的语义是**替换宿主的「消息面」**：`dsh-session` 的
`applySurfacePlan()` 把这个区间的节点从"送给模型的消息序列"里换成本次事件
（压缩后模型看到的是摘要，不是被压缩的原文）。它**不改写对话记录**。
官方网页端的行为与之一致 —— `dsh-client-ui-chat` 的 `systemMessageDefinition`：

> Positional replacements advance the effective prompt **without changing historical cards**.

旧实现（`ui.ts` 的 `applySurfaceReplace`）把它当成了"删除锚点落在区间内的所有节点"，
于是压缩后屏幕上只剩一条压缩行。**数据从未丢失，只是没画出来。**

### 修复

删掉 `applySurfaceReplace` 及调用点：replace 事件不再删除任何节点，
压缩行作为新增的一条标记出现在对话里，历史原样保留。
另一个 replace 来源（`dsh-compaction-tool-result-pruner` 的工具结果剪枝）是单节点替换，
替换事件本身就是带裁剪正文的 `tool/result`，`tool/result` 分支按 `callId` 就地更新那一行，
不需要（也不应该）删旧节点。

### 验证

- `node tools/test-compaction-row.mjs`：修复前 **64/70**（红的 6 条正是"压缩后历史不可见"），
  修复后 **70/70**。测试头部与 6 条断言已按「replace 不清历史」改写。
- 真实数据端到端：把本机这条会话的**全部 1982 条真实记录**重放进修复后的
  `dist/webview/ui.js`（jsdom），结果是 `压缩前用户消息 12 条 / 采样正文命中 11/11`、
  `.msg-user=14`、压缩行 `.cmd-row=1` —— 包括最早那句「帮我安装 mattpoc…」都可见。
- 其余套件：`test-context-overflow-alert` 41/41、`test-open-routing` 全部符合预期。
  `test-agent-error-notice`（需要 spawn 子进程）、`test-checkpoint-lock`（脚本自身 helper 返回非字符串）、
  `test-stats-merge`（缺生成的 `tmp/ui-harness.js`）在本机为环境性失败，与本次改动无关。

### 与上游的差异

上游 0.13.39 仍然按区间折叠（其 CHANGELOG 里写作"被压缩的区间在对话中折叠"）。
本 fork 已改为保留历史 —— 这是**刻意的行为分歧**，值得单独提一个上游 issue。

---

## 修复 4：运行中发的消息永远挂在最底下，新内容反而出现在它上面

### 症状

上一回合还在跑的时候发一条消息，那条消息就一直停在对话末尾；它之后产生的思考、
工具行、回答全部渲染在**它上方**。DSH 网页端按事件顺序渲染，消息会随着新输出自然
上移 —— 扩展里不会。

### 机制

宿主的日志顺序是「助手段 → 用户消息 → 同一回合的助手段」（插队/排队消息进的是**同一个
回合**，`turn/end` 还没来）。而扩展挂载新内容时是这么找落点的：

```ts
function findAssistantTail() {          // 从尾往前找最后一个 assistant 节点
  for (let i = state.nodes.length - 1; i >= 0; i--) {
    if (state.nodes[i].kind === "assistant") return state.nodes[i];
  }
}
```

用户消息只是一个兄弟节点，**不会中断这次查找**；三个挂载点
（`beginAssistantBlock` / `assistant/message` 的工具行 / `tool/call`）
又只在"回合号不同"时才新建节点，于是同一回合内消息之后的所有行都被塞回
**消息上方**那个旧节点 —— 气泡于是永远停在最底下。

### 修复

新增 `findOpenAssistantTail()`：沿节点往回走时**遇到用户消息（或排队卡片）就返回
undefined**，调用方随即在消息**下方**新建一段。三个挂载点改用它；
`findAssistantTail()` 保持原样（段尾汇总、工具行刷新仍需要"最近一个助手段"，
否则旧段落的汇总不会更新）。

### 验证

- 新增 `node tools/test-steer-segment.mjs`（16 条）：插队消息、排队卡片、两个普通回合、
  压缩检查点。修复前 **11/15**（红的三条正是"新工具行/思考/回答跑到了气泡上方"、
  "气泡后面没有任何内容"），修复后 **16/16**。
- 压缩套件保持 **70/70**（修复 3 未回归）。
- 真实数据：把本机这条会话的 2214 条真实记录重放进修复后的产物，那条真实的插队消息
  （seq 1708）现在排在其回答（seq 1709）之上（DOM 位置 1069582 < 1071830）。

### 与上游的差异

上游 0.13.39 同样只在"回合号变化"时新建助手段，因此同样存在这个顺序问题。
本 fork 已改为按用户消息分段。

---

## 修复 5：恢复态的会话能发消息、却永远收不到回程内容

### 症状

重开窗口后接着聊：消息发得出去，服务器也照常把回合跑完（配额、日志、胶囊都在动），
但面板里的对话**定格不动**。开一个新会话则一切正常。

### 机制

`session/follow` 是挂在 remote.mux **socket** 上的逻辑流。socket 一旦被替换
（服务器重启、断线重连、webview 重载），流就死了；而 `store.currentSessionId` 还在，
界面看不出任何异常。旧的 `onError` 只清 `followedSession`、**不清句柄**，
于是幂等判断 `followedSession === sessionId && followHandle` 会命中那个残留的死句柄，
把重开挡掉；`onEnd` 则根本没接。

### 修复

- 连接(重)建立时重挂跟随（`hub.ts`，socket 重建后强制重开）；
- 新增幂等的 `ensureFollowing()`，在服务器(重)上线、webview ready 时各补挂一次；
- `onEnd` / `onError` 统一走 `drop()` 清句柄，并留一行 `[follow] 会话跟随断开/已打开` 日志便于取证。

### 验证

既有全部测试套件通过（70/70、41/41、16/16、6/6、open-routing、stats-merge、checkpoint-lock）。
真实场景待验证：本次改动装的 0.13.44 需要 **reload 窗口** 才生效。

---

## 附带修复：0.2.0 内核下的两处适配

### 「DSH: 在浏览器打开」必然 401

0.1.2 起 `GET /` 只认 `dsh web` 打印的启动 token（换签名 cookie），
而该命令开的是配置里的裸地址 → 浏览器只拿到
`dsh web authentication required; reopen the URL printed by dsh web` 文本页。
现在把扩展**已经从启动日志解析到的** token 拼上；服务器非本扩展启动时回退原地址，
并在输出通道留一行说明。

### `dsh-git-rollback` 被 0.2.0 内核停用

内核 0.2.0 新增运行期 peer 校验，启动时把随包插件关掉：

```
dsh: disabling profile plugin row "git-rollback": Plugin dsh-git-rollback@0.1.10
     is incompatible with dsh 0.2.0-rc.2: peerDependencies {"@deepseek-ai/dsh-session":"^0.1.0-rc.6", …}
```

后果是 `/rollback`、`/redo`、`/undo`、`/checkpoints` 静默消失。
插件只用到 `ctx.on("session/event")`、`ctx.effect`、`ctx.commands.register`（三者未变），
纯粹是 peer 范围过时 → 已在 `resources/dsh-git-rollback/package.json` 补上 `|| ^0.2.0-rc.1`。

注意：`^0.2.0-rc.1` 这种写法是必须的 —— `>=0.1.0-rc.6 <0.3.0` 之类的范围
在 semver 里**不匹配** `0.2.0-rc.2`（带预发布号的版本只被同 `major.minor.patch`
且自身含预发布号的比较器接受）。npm 上 `dsh-git-rollback` 最新只到 0.1.8 且 peer 同样陈旧，
所以只能改随包这份。

**更新扩展后必须重装随包插件**（profile 里是 pnpm 的 `file:` 真实副本，不是符号链接）：

```powershell
node <anchor>\node_modules\@deepseek-ai\dsh\lib\bin.js plugin --profile web add `
  file:c:/Users/lenovo/.vscode/extensions/idealauror.dsh-vscode-0.13.44/resources/dsh-git-rollback
```

---

## 构建

```powershell
cd <此目录>
npm ci --cache .\.npm-cache        # jsdom 仅测试需要
node esbuild.mjs                   # 产出 dist/extension.js + dist/webview/*.js
npx --no-install vsce package --out dsh-vscode-local.vsix --allow-missing-repository
```

`node tools/sync-plugins.mjs`（`npm run build` 的一部分）**在本机会失败**：
它要编译 `plugins/` 下的 DSH 服务端插件，而 `@deepseek-ai/dsh-*` 类型包不在本仓库依赖里。
这不影响扩展本体——`resources/` 在克隆时已存在，vsce 照常打包（vsix 内含 10 个
`resources/dsh-git-rollback/*`，已与上游可用版本逐字节比对一致）。只有需要**改动附带插件**时才要处理它。

版本号：`node tools/bump-version.mjs <x.y.z>`（同步 `package.json` + `README.md`）。

## 测试

```powershell
$env:DSH_JSDOM_ENTRY = "$PWD\node_modules\jsdom\lib\api.js"
node tools/test-compaction-row.mjs
```

基线：**70 项全部通过，0 失败**（0.13.42 起；此前 69 项——修复 1 删掉那条 100% 快捷分支后
该套件从 69 变 70，修复 3 又把 2 条断言翻面并新增 4 条，合计 70）。

全套（0.13.44 实测，全部绿）：

| 套件 | 结果 | 备注 |
|---|---|---|
| `test-compaction-row.mjs` | 70/70 | |
| `test-steer-segment.mjs` | 16/16 | |
| `test-context-overflow-alert.mjs` | 41/41 | |
| `test-stats-merge.mjs` | 全部符合预期 | 需要先构建 `tmp/ui-harness.js` |
| `test-agent-error-notice.mjs` | 6/6 | |
| `test-open-routing.mjs` | 全部符合预期 | |
| `test-checkpoint-lock.mjs` | DONE | 会 spawn `git` |

`test-stats-merge.mjs` 依赖的夹具要先生成一次（否则报「缺少 tmp/ui-harness.js」）：

```powershell
node node_modules/esbuild/bin/esbuild src/webview/ui.ts --bundle --platform=browser --format=iife --outfile=tmp/ui-harness.js
```

本 fork 已把该测试里两处作者本机硬编码路径改为相对路径（`D:/Workspace/vscode/...`），
否则在别的机器上跑不起来。**不应把这两处改动推回上游。**

## 内核升级后的适配检查

改扩展与内核的对接时，先跑一遍只读探针（会读启动日志里的 token，自动换取 cookie）：

```powershell
node c:\Users\lenovo\Desktop\deep-reading\.dsh\probe-live-api.mjs
```

它打的是扩展依赖的那一层 API（`session/list`、`session/page`、`session/projections`、
`skills/list`、`settings/describe`、`dynamicCordisRunner/inventory` …）。
已知结论：`subagents/list` 在 0.2.0 **已移除**（扩展已改读 `subagentCatalog` 投影，
端点只作旧宿主回退，404 属预期）；`schedule/*` 在本 profile 从未注册（无宿主插件，非升级所致）。

## 安装

```powershell
& "E:\Programs\Microsoft VS Code\bin\code.cmd" --install-extension .\dsh-vscode-local.vsix --force
```

### 必须禁用原版

两个扩展注册**同一套命令、视图和 `@dsh` 聊天参与者**，同时启用时由哪个响应是不确定的。
装完请在 VS Code 里禁用原版：`Ctrl+Shift+X` → 搜 `DeepSeek Harness` →
publisher 是 **Jager** 那个 → **Disable**（保留已禁用的原版可作为回退）。

## 如何同步上游更新

```
origin    → https://github.com/IdealAuror/DeepSeek-Harness-for-VS-Code.git   你自己的 fork，可推
upstream  → https://github.com/NEXTINDIE/DeepSeek-Harness-for-VS-Code.git    作者仓库，只取更新
```

```powershell
git fetch upstream
git rebase upstream/main
git push origin main
```

冲突只会出现在 `cacheHitPercentText()`、`ensure()`/`start()` 那几处
（以及若上游也改了该测试的硬编码路径）。解冲突后重跑构建 + 测试。

**若上游已修好这些 bug**：直接放弃本 fork，卸载它、重新启用原版即可。
也可以把修复提成 PR 给上游（`gh pr create --repo NEXTINDIE/DeepSeek-Harness-for-VS-Code`）；
注意修复 1 和 2 应分成独立的 PR，`FORK-NOTES.md` 与测试路径改动不要带上。
