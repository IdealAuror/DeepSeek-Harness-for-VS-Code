import * as vscode from "vscode";
import type { DshHub } from "./hub";
import { createTranslator } from "./i18n";
import { activeFolder } from "./participantSessions";
import type { SessionModelsValue } from "./types";

/**
 * 源代码管理(SCM)视图的「生成提交信息」功能:
 * 取内置 git 扩展的 diff → 在一次性 DSH 会话(创建即归档,不占用会话列表)中选中轻量模型
 * (默认按 `dsh.commitModel` 关键字 flash 解析,思考深度 low)→ 发送生成提示词 →
 * 等待回合结束 → 提取最终文本写入 SCM 输入框。
 *
 * 模型切换会持久化到 profile(0.1.7 宿主行为),因此生成结束后必须恢复用户原默认选择,
 * 详见 applyCommitModel。
 */

const t = createTranslator();

/** diff 上限字符数(超出截断,避免超大提交拖慢生成)。 */
const MAX_DIFF_CHARS = 50_000;
/** 生成超时:超过则取消会话并报错。 */
const GENERATION_TIMEOUT_MS = 120_000;

// ---------- 内置 git 扩展 API(最小类型,运行时特性检测;官方类型由 vscode.git 扩展自身提供) ----------

interface GitRepositoryLike {
  readonly rootUri: vscode.Uri;
  readonly inputBox: { value: string };
  diff(cached?: boolean): Promise<string>;
}

interface GitApiLike {
  readonly repositories: GitRepositoryLike[];
  getRepository(uri: vscode.Uri): GitRepositoryLike | null;
}

async function getGitApi(): Promise<GitApiLike | undefined> {
  const ext = vscode.extensions.getExtension<{ getAPI(version: number): GitApiLike }>("vscode.git");
  if (!ext) return undefined;
  try {
    const exports = ext.isActive ? ext.exports : await ext.activate();
    const api = exports.getAPI(1);
    if (!api || typeof api.getRepository !== "function") return undefined;
    return api;
  } catch {
    return undefined;
  }
}

/** scm/title 菜单传入的第一个参数是 SourceControl(带 rootUri)。 */
function argRootUri(arg: unknown): vscode.Uri | undefined {
  const sc = arg as { rootUri?: unknown } | undefined;
  return sc?.rootUri instanceof vscode.Uri ? sc.rootUri : undefined;
}

async function resolveRepository(api: GitApiLike, arg: unknown): Promise<GitRepositoryLike | undefined> {
  const root = argRootUri(arg) ?? activeFolder()?.uri;
  if (root) {
    const direct = api.getRepository(root);
    if (direct) return direct;
    const nested = api.repositories.find((r) => root.toString().startsWith(r.rootUri.toString()));
    if (nested) return nested;
  }
  if (api.repositories.length === 1) return api.repositories[0];
  if (api.repositories.length > 1) {
    const picked = await vscode.window.showQuickPick(
      api.repositories.map((r) => ({ label: r.rootUri.fsPath, repo: r })),
      { placeHolder: t("commit.pickRepo") },
    );
    return picked?.repo;
  }
  return undefined;
}

/** 优先已暂存改动(index vs HEAD);为空回退未暂存(工作区 vs index)。 */
async function collectDiff(repo: GitRepositoryLike): Promise<string | undefined> {
  let diff = "";
  let staged = false;
  try {
    diff = (await repo.diff(true)).trim();
    staged = diff !== "";
  } catch {
    diff = "";
  }
  if (!diff) {
    try {
      diff = (await repo.diff(false)).trim();
    } catch {
      diff = "";
    }
  }
  if (!diff) return undefined;
  const kindKey = staged ? "commit.diffStaged" : "commit.diffUnstaged";
  if (diff.length > MAX_DIFF_CHARS) {
    diff = `${diff.slice(0, MAX_DIFF_CHARS)}\n… (${t("commit.diffTruncated")})`;
  }
  // 把 diff 来源与规模写进日志,便于诊断「点了没反应」这类静默失败
  console.log(`[dsh] commit message diff: ${t(kindKey)} · ${diff.length} chars`);
  return diff;
}

/**
 * 未取到 diff 时的诊断提示:区分「本来就没有改动」和「只有未跟踪文件」
 * (git diff 不含未跟踪文件,此时必须 git add 才看得到)。
 */
async function explainNoDiff(repo: GitRepositoryLike): Promise<string> {
  const untracked = await countUntracked(repo);
  if (untracked > 0) return t("commit.onlyUntracked", { n: String(untracked) });
  return t("commit.noChanges");
}

/** 统计未跟踪文件数;取不到时返回 0(不阻塞提示)。 */
async function countUntracked(repo: GitRepositoryLike): Promise<number> {
  try {
    const git = await import("node:child_process");
    const out = await new Promise<string>((resolve, reject) => {
      git.execFile("git", ["ls-files", "--others", "--exclude-standard"], { cwd: repo.rootUri.fsPath, maxBuffer: 4 * 1024 * 1024 }, (error, stdout) =>
        error ? reject(error) : resolve(stdout),
      );
    });
    return out.split("\n").filter((line) => line.trim() !== "").length;
  } catch {
    return 0;
  }
}

// ---------- 一次性会话:生成期间隐藏,结束后归档 ----------
// 注意(0.1.7 起的宿主语义):已归档会话的回合会以 reason.kind = "blocked" 立即结束,
// 因此「先归档再生成」会让模型一次都不被调用(用户看到「模型未返回有效提交信息」)。
// 正确顺序是:创建 → 生成 → 归档;生成期间用本地隐藏集合把它从下拉列表藏起来。

function commitSessionKey(root: vscode.Uri): string {
  return `dsh.commit.session:${root.toString()}`;
}

/** 提交会话本地隐藏集合(仅在生成期间生效):UI 列表按归档语义隐藏它。 */
const hiddenCommitSessions = new Set<string>();

/** 提交会话是否处于本地隐藏(生成中)。 */
export function isHiddenCommitSession(sessionId: string): boolean {
  return hiddenCommitSessions.has(sessionId);
}

/** 创建提交信息专用会话并临时隐藏;全程不打断用户当前对话(保存并恢复原当前会话)。 */
async function createCommitSession(hub: DshHub, root: vscode.Uri): Promise<string> {
  // 保存用户当前会话:提交会话绝不激活到对话列表
  const prev = hub.store.currentSessionId;
  const sessionId = await hub.createSession(root.fsPath);
  hiddenCommitSessions.add(sessionId);
  // 恢复原当前会话(提交会话保持隐藏 + 非当前,下拉列表与对话区都不出现)
  hub.store.selectSession(prev);
  return sessionId;
}

/** 生成结束:归档并解除隐藏(归档失败也解除隐藏,避免会话永久消失)。 */
async function finishCommitSession(hub: DshHub, sessionId: string): Promise<void> {
  hiddenCommitSessions.delete(sessionId);
  try {
    await hub.archiveSession(sessionId);
  } catch (error) {
    console.error("[dsh] archive commit session failed:", error);
  }
}

/** 清理旧版本遗留的「每仓库常驻」提交会话:归档并移除映射。 */
async function cleanupLegacyCommitSession(hub: DshHub, ctx: vscode.ExtensionContext, root: vscode.Uri): Promise<void> {
  try {
    const key = commitSessionKey(root);
    const legacy = ctx.workspaceState.get<string>(key);
    if (legacy && hub.store.sessions.has(legacy)) {
      await hub.archiveSession(legacy);
    }
    await ctx.workspaceState.update(key, undefined);
  } catch (error) {
    console.error("[dsh] cleanup legacy commit session failed:", error);
  }
}

// ---------- 模型选择 ----------
// 重要(0.1.7 起的行为):宿主 session/selectModel 会把所选模型 + 思考深度
// 持久化到 profile 的 agent-default-model(下次新建会话的默认值),
// 因此为一次性提交会话切换模型必须「先记录原默认值、生成结束后恢复」,
// 否则用户的默认模型/思考深度会被悄悄改成提交用的轻量档(如 low)。
// 另外提交模型在目录里不存在时不再直接失败,而是回退到目录中的轻量模型。

interface ModelSelectionView {
  provider: string;
  model: string;
  reasoningEffort?: string;
}

/** 提交模型关键字:默认 flash(轻量档);留空 = 不切换模型,直接用会话默认。 */
const DEFAULT_COMMIT_MODEL = "flash";

function modelEfforts(model: { reasoning?: { efforts?: { id: string }[] } } | undefined): string[] {
  return (model?.reasoning?.efforts ?? []).map((e) => e.id);
}

/**
 * 在模型目录中解析提交模型:
 * 1. 关键字(默认 `flash`)在模型 id / 名称上做包含匹配,取第一个命中;
 * 2. 未配置关键字时直接用会话默认(不切换);
 * 3. 关键字无命中时回退到目录里第一个「支持关闭思考」的模型,再退回第一个模型。
 * 完全解析不到时返回 undefined(调用方保持会话当前模型,不再让整个功能失败)。
 */
function resolveCommitModel(models: SessionModelsValue, wantModel: string): { provider: string; model: string; efforts: string[] } | undefined {
  const groups = models.groups ?? [];
  const rows = groups.flatMap((g) => (g.models ?? []).map((m) => ({ provider: g.id, model: m })));
  if (rows.length === 0) return undefined;
  const needle = wantModel.trim().toLowerCase();
  if (!needle) {
    const current = rows.find((r) => r.provider === models.current?.provider && r.model.id === models.current?.model);
    return current ? { provider: current.provider, model: current.model.id, efforts: modelEfforts(current.model) } : undefined;
  }
  const exact = rows.find((r) => r.model.id.toLowerCase() === needle);
  const partial = exact ?? rows.find((r) => r.model.id.toLowerCase().includes(needle) || (r.model.name ?? "").toLowerCase().includes(needle));
  const fallback = partial ?? rows.find((r) => modelEfforts(r.model).includes("off")) ?? rows[0];
  return { provider: fallback.provider, model: fallback.model.id, efforts: modelEfforts(fallback.model) };
}

/**
 * 为一次性提交会话选择轻量模型,并返回「恢复用户默认选择」的闭包。
 * 未做任何改动时返回的闭包是空操作(不产生多余的 profile 写入)。
 */
async function applyCommitModel(hub: DshHub, sessionId: string): Promise<() => Promise<void>> {
  const noop = async () => {};
  const cfg = vscode.workspace.getConfiguration("dsh");
  const wantModel = (cfg.get<string>("commitModel", DEFAULT_COMMIT_MODEL) ?? DEFAULT_COMMIT_MODEL).trim();
  const wantEffort = (cfg.get<string>("commitReasoningEffort", "low") ?? "low").trim();

  const models = await hub.getSessionModels(sessionId);
  // 用户当前的默认选择(即 profile 里 agent-default-model 的值):生成结束后要恢复它
  const original: ModelSelectionView | undefined = models.current
    ? { provider: models.current.provider, model: models.current.model, ...(models.current.reasoningEffort ? { reasoningEffort: models.current.reasoningEffort } : {}) }
    : undefined;
  const restore = async () => {
    if (!original) return;
    try {
      await hub.selectModel(sessionId, original.provider, original.model, original.reasoningEffort);
    } catch (error) {
      console.error("[dsh] restore default model after commit message failed:", error);
    }
  };

  const target = resolveCommitModel(models, wantModel);
  if (!target) return noop; // 目录为空:保持会话当前模型
  const effort = target.efforts.includes(wantEffort) ? wantEffort : undefined;
  if (!wantModel.trim() && !effort) return noop; // 未配置关键字:不动模型
  const same =
    original !== undefined &&
    original.provider === target.provider &&
    original.model === target.model &&
    (effort === undefined || original.reasoningEffort === effort);
  if (same) return noop;
  await hub.selectModel(sessionId, target.provider, target.model, effort);
  return restore;
}

// ---------- 生成流程 ----------

function buildPrompt(diff: string): string {
  return [
    "请根据下面的 git diff 生成一条提交信息(commit message)。",
    "",
    "要求:",
    "- 使用 Conventional Commits 风格(如 feat: / fix: / refactor: / chore: 等);",
    "- 第一行为主题行,必要时用空行分隔后接简短正文;",
    "- 不要调用任何工具,不要执行任何操作;",
    "- 不要解释,直接输出提交信息本身(不要用 markdown 代码块包裹)。",
    "",
    "git diff:",
    "```diff",
    diff,
    "```",
  ].join("\n");
}

type WaitOutcome = "done" | "cancelled" | "error" | "timeout" | "interrupted";

/**
 * 等待本轮生成结束。beforeTurn = 发送前最后一个已完成回合,
 * 避免上一次生成(若仍在运行)的 turnEnd 提前唤醒。
 */
function waitForTurnEnd(hub: DshHub, sessionId: string, beforeTurn: number, isCancelled: () => boolean): Promise<WaitOutcome> {
  return new Promise((resolve) => {
    let finished = false;
    const unsubs: (() => void)[] = [];
    let poll: ReturnType<typeof setInterval> | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const finish = (outcome: WaitOutcome) => {
      if (finished) return;
      finished = true;
      if (poll !== undefined) clearInterval(poll);
      if (timer !== undefined) clearTimeout(timer);
      for (const u of unsubs) u();
      resolve(outcome);
    };
    unsubs.push(
      hub.store.on("turnEnd", (sid: string, turn: number) => {
        if (sid === sessionId && turn > beforeTurn) finish("done");
      }),
      hub.store.on("agentError", (sid: string) => {
        if (sid === sessionId) finish("error");
      }),
      // 纯文本场景:模型一旦请求审批/提问,取消并提示
      hub.store.on("approval", (approval) => {
        if (approval.sessionId === sessionId) {
          void hub.cancel(sessionId);
          finish("interrupted");
        }
      }),
      hub.store.on("question", (question) => {
        if (question.sessionId === sessionId) {
          void hub.cancel(sessionId);
          finish("interrupted");
        }
      }),
    );
    poll = setInterval(() => {
      if (isCancelled()) {
        void hub.cancel(sessionId);
        finish("cancelled");
      }
    }, 250);
    timer = setTimeout(() => {
      void hub.cancel(sessionId);
      finish("timeout");
    }, GENERATION_TIMEOUT_MS);
  });
}

/** 提取最后一轮 assistant 最终消息中的文本块。 */
function extractCommitMessage(hub: DshHub, sessionId: string, minSeq: number): string {
  const events = hub.store.eventsFor(sessionId).filter((e) => e.event.seq > minSeq);
  const messages = events.filter((e) => e.event.type === "assistant/message");
  if (messages.length === 0) return "";
  const last = messages[messages.length - 1].event;
  const content: unknown[] = last.data?.message?.content ?? [];
  const text = content
    .filter((b): b is { type: string; text: string } => {
      const item = b as { type?: unknown; text?: unknown } | null | undefined;
      return !!item && item.type === "text" && typeof item.text === "string";
    })
    .map((b) => b.text)
    .join("\n");
  return cleanupCommitMessage(text);
}

function cleanupCommitMessage(text: string): string {
  let out = text.trim();
  out = out.replace(/^```[a-zA-Z]*\s*\n?/, "").replace(/\n?```\s*$/, "");
  return out.trim();
}

// ---------- 命令注册 ----------

export function registerCommitMessageCommand(hub: DshHub, ctx: vscode.ExtensionContext): vscode.Disposable {
  return vscode.commands.registerCommand("dsh.generateCommitMessage", async (arg?: unknown) => {
    const api = await getGitApi();
    if (!api) {
      void vscode.window.showWarningMessage(t("commit.noGitApi"));
      return;
    }
    const repo = await resolveRepository(api, arg);
    if (!repo) {
      void vscode.window.showWarningMessage(t("commit.noRepo"));
      return;
    }
    const diff = await collectDiff(repo);
    if (!diff) {
      void vscode.window.showInformationMessage(await explainNoDiff(repo));
      return;
    }
    const ready = await hub.ensureReady();
    if (!ready.ok) {
      void vscode.window.showErrorMessage(t("commit.serverUnavailable", { message: ready.message ?? "" }));
      return;
    }
    await cleanupLegacyCommitSession(hub, ctx, repo.rootUri);
    let sessionId: string;
    try {
      sessionId = await createCommitSession(hub, repo.rootUri);
    } catch (error) {
      void vscode.window.showErrorMessage(t("commit.failed", { error: error instanceof Error ? error.message : String(error) }));
      return;
    }
    // 0.1.2 会话事件按地址分路:归档的一次性会话必须单独 follow 才能收到 turnEnd,
    // 否则 waitForTurnEnd 永远等不到回合结束而超时(不影响当前会话的 UI 跟随)。
    const watch = hub.watchSession(sessionId);

    await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: t("commit.generating"), cancellable: true },
      async (_progress, token) => {
        let cancelled = false;
        token.onCancellationRequested(() => {
          cancelled = true;
        });
        // 恢复用户默认模型选择的闭包:宿主 selectModel 会持久化到 profile,
        // 必须在所有退出路径(成功 / 取消 / 超时 / 出错)上把默认值还原回去。
        let restoreModel: () => Promise<void> = async () => {};
        try {
          try {
            restoreModel = await applyCommitModel(hub, sessionId);
          } catch (error) {
            void vscode.window.showErrorMessage(t("commit.failed", { error: error instanceof Error ? error.message : String(error) }));
            return;
          }
          const beforeTurn = hub.store.lastTurnBySession.get(sessionId) ?? 0;
          const promptSeq = hub.store.maxSeq.get(sessionId) ?? 0;
          try {
            await hub.send(sessionId, buildPrompt(diff));
          } catch {
            return; // hub.send 已通过 onNotice 弹出错误提示
          }
          const outcome = await waitForTurnEnd(hub, sessionId, beforeTurn, () => cancelled);
          switch (outcome) {
            case "cancelled":
              void vscode.window.showInformationMessage(t("commit.cancelled"));
              return;
            case "timeout":
              void vscode.window.showErrorMessage(t("commit.timeout"));
              return;
            case "interrupted":
              void vscode.window.showWarningMessage(t("commit.interrupted"));
              return;
            case "error":
              void vscode.window.showErrorMessage(t("commit.failed", { error: t("commit.agentError") }));
              return;
            case "done":
              break;
          }
          const message = extractCommitMessage(hub, sessionId, promptSeq);
          if (!message) {
            // 空结果也要能自证原因:是模型没被调用(回合被 block / 没有 assistant 消息),
            // 还是模型返回了非文本内容(例如只出思考块)。
            const events = hub.store.eventsFor(sessionId).filter((e) => e.event.seq > promptSeq);
            const assistantCount = events.filter((e) => e.event.type === "assistant/message").length;
            const turnEnd = events.filter((e) => e.event.type === "turn/end").at(-1);
            const reason = (turnEnd?.event.data as { reason?: { kind?: string } } | undefined)?.reason?.kind ?? "unknown";
            console.log(
              `[dsh] commit message empty: assistantMessages=${assistantCount} events=${events.length} turnEndReason=${reason}`,
            );
            void vscode.window.showWarningMessage(
              t("commit.empty", { reason, events: String(events.length), messages: String(assistantCount) }),
            );
            return;
          }
          repo.inputBox.value = message;
          void vscode.window.showInformationMessage(t("commit.done"));
        } finally {
          await restoreModel();
          await finishCommitSession(hub, sessionId);
          watch.cancel();
        }
      },
    );
  });
}
