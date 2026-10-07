# dsh-vscode (local fork)

[`NEXTINDIE/DeepSeek-Harness-for-VS-Code`](https://github.com/NEXTINDIE/DeepSeek-Harness-for-VS-Code)
的本地 fork，目前承载两处修复。

- 上游 issue：[#22 缓存命中恒显示 100%](https://github.com/NEXTINDIE/DeepSeek-Harness-for-VS-Code/issues/22)
- 第二个修复（服务器生命周期）尚未提 issue

| | 上游 | 本 fork |
|---|---|---|
| 扩展 ID | `Jager.dsh-vscode` | `IdealAuror.dsh-vscode` |
| 版本 | 0.13.39 | 0.13.41 |
| 显示名 | DeepSeek Harness for VS Code | … (local fix) |

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

基线：**69 项全部通过，0 失败**。

本 fork 已把该测试里两处作者本机硬编码路径改为相对路径（`D:/Workspace/vscode/...`），
否则在别的机器上跑不起来。**不应把这两处改动推回上游。**

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
