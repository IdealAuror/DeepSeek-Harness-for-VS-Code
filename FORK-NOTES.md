# dsh-vscode (local fork) — 缓存命中率修复

本目录是 [`NEXTINDIE/DeepSeek-Harness-for-VS-Code`](https://github.com/NEXTINDIE/DeepSeek-Harness-for-VS-Code)
的本地 fork，只为修一个 bug 而维护。

上游 issue：[NEXTINDIE/DeepSeek-Harness-for-VS-Code#22](https://github.com/NEXTINDIE/DeepSeek-Harness-for-VS-Code/issues/22)

---

## 修了什么

Token 胶囊的「缓存命中」在插件里恒显示 `100%`（同一会话在 DSH 原生端显示 `98%`）。

**根因**：`src/webview/ui.ts` 的 `cacheHitPercentText()` 有一条与本函数文档相矛盾的快捷分支：

```ts
if (promptTokens - cacheReadTokens <= 0) return "100";   // 已删除
```

任何 `cacheReadTokens >= promptTokens` 的输入都会被**无条件断言成 100%**，不做一致性校验。
窗口内只剩高命中的近期请求、或分母取自小于缓存读取的子集时，就会落进这一条。

值得注意的是：**上游仓库里本来就有一个测试在断言相反的行为**——

`tools/test-compaction-row.mjs`

```js
check("部分命中 99.6% 不被进位成 100%", ...);
check("极接近 100% 时提高精度", ...);
check("完全命中显示 100%", ...);
```

也就是说这个快捷分支一直让上游自己的测试失败。本 fork 让实现符合它自己的测试。

**改动**（`src/webview/ui.ts`）：

```ts
const ratio = cacheReadTokens / Math.max(promptTokens, cacheReadTokens);
```

删掉快捷分支后一律走比例计算：真实满命中仍显示 `100`，部分命中显示带小数的真实值。
分母取下限是为了防止输入不一致时算出 >100%。

### 已知残留

修好后仍可能与原生端差约 1 个百分点（如插件 99% vs 原生 98%）。
那是另一个问题：插件在 `hub.ts` 用 `HISTORY_PAGE_MESSAGES = 60` 只拉 60 条消息，
投影到达前/重绘后由 `deriveStatsFromEvents()` 在这个窗口上求和（0.13.38 为「回合进行中也能看到胶囊」而引入）。
该值口径偏窄、天生偏高。彻底修需要改数据来源，改动面较大，留给上游。

---

## 构建

```powershell
cd <此目录>
npm ci --cache .\.npm-cache        # jsdom 仅测试需要
node esbuild.mjs                   # 产出 dist/extension.js + dist/webview/*.js
npx --no-install vsce package --out dsh-vscode-0.13.40-local.vsix --allow-missing-repository
```

`node tools/sync-plugins.mjs`（`npm run build` 的一部分）**在本机会失败**：
它要编译 `plugins/` 下的 DSH 服务端插件，而 `@deepseek-ai/dsh-*` 类型包不在本仓库依赖里。
这不影响扩展本体——`resources/` 在克隆时已存在，vsce 会照常打包（vsix 内含 10 个 `resources/dsh-git-rollback/*`）。
只有在你需要**改动附带插件**时才需要处理它。

## 测试

```powershell
$env:DSH_JSDOM_ENTRY = "$PWD\node_modules\jsdom\lib\api.js"
node tools/test-compaction-row.mjs
```

本 fork 已把该测试里两处作者本机硬编码路径改为相对路径（`D:/Workspace/vscode/...`），
否则在别的机器上跑不起来。不应把这两处改动推回上游。
基线：**69 项全部通过，0 失败**。

## 安装

```powershell
& "E:\Programs\Microsoft VS Code\bin\code.cmd" --install-extension .\dsh-vscode-0.13.40-local.vsix --force
```

### 必须禁用原版

两个扩展注册**同一套命令、视图和 `@dsh` 聊天参与者**，同时启用时由哪个响应是不确定的。
装完请在 VS Code 里禁用原版：

`Ctrl+Shift+X` → 搜索 `DeepSeek Harness` → 找到 **Jager** 那个（0.13.39）→ **Disable**

或直接卸载（`code --uninstall-extension Jager.dsh-vscode`）——但保留已禁用的原版可以作为回退。

## 如何同步上游更新

remote 布局（已配置好）：

```
origin    → https://github.com/IdealAuror/DeepSeek-Harness-for-VS-Code.git   你自己的 fork，可推
upstream  → https://github.com/NEXTINDIE/DeepSeek-Harness-for-VS-Code.git    作者仓库，只取更新
```

```powershell
git fetch upstream
git rebase upstream/main        # 或 git merge upstream/main
git push origin master
```

冲突只会出现在 `cacheHitPercentText()` 那一处（以及若上游也改了该测试的硬编码路径）。
解冲突后重跑构建 + 测试。

**若上游已修好此 bug**：直接放弃本 fork，卸载它、重新启用原版即可。
也可以顺手把修复提成 PR 给上游（`gh pr create --repo NEXTINDIE/DeepSeek-Harness-for-VS-Code`）。

---

## 身份

| | 上游 | 本 fork |
|---|---|---|
| 扩展 ID | `Jager.dsh-vscode` | `IdealAuror.dsh-vscode` |
| 版本 | 0.13.39 | 0.13.40 |
| 显示名 | DeepSeek Harness for VS Code | … (local fix) |

publisher 与版本号是刻意的：publisher 决定扩展 ID，改了才能与上游并存、互不覆盖；
版本号高于上游，避免 VS Code 把它当成回退。
