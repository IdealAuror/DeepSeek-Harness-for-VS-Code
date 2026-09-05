/**
 * DSH Web API 的 wire 类型(对齐 @deepseek-ai/dsh 0.1.2-rc.1 的 Typert Remote 契约)。
 *
 * 0.1.1-rc.2 → 0.1.2-rc.1 协议变更(alpha.4 → rc.1 无线协议变化,已按发布的
 * rc.1(0.1.2-rc.1)核对全部端点/流/认证契约):
 * - 一元端点为斜杠形式 <namespace>/<method>(session.list → session/list),
 *   载荷信封 payload 必须是恰好一个字段的 { args: {...} };
 * - host.describe 已移除(版本/主机信息改由 $events 打开帧 + session/modelCatalog 提供);
 * - /api/respond 移除,审批/提问改走 $events waterfall + /api/$events/result;
 * - /api/events.mux 与 /api/events.host 移除,改为 /api/remote.mux 单 WebSocket 多路流:
 *   session/follow(会话事件)、session/control(队列/任务/投影)、workspace/follow(工作区)、$events(主机事件);
 * - /api 需要浏览器认证 cookie(GET /?token=… 交换)。
 */

// ---------- RPC 信封 ----------

export interface RpcError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ClientRequest {
  type: "client-request";
  rpcId: string;
  method: string;
  payload: unknown;
}

export interface ServerRequest {
  type: "server-request";
  rpcId: string;
  method: string;
  payload: unknown;
}

// ---------- 会话事件 ----------

export interface SessionEvent {
  type: string;
  seq: number;
  time: number;
  data: any;
  sourceEventSeqs?: number[];
  surfaceOp?: unknown;
  ignorable?: true;
}

export interface ToolEventView {
  for: "call" | "result";
  view: { card: string; [key: string]: unknown };
}

export interface SessionSummary {
  sessionId: string;
  updatedAt: number;
  running: boolean;
  blank: boolean;
  parentSessionId?: string;
  origin?: "subagent";
  cwd?: string;
  /** 0.1.2 起 agentPreset 移到 projections.values.agentPreset。 */
  agentPreset?: string;
  projections?: { asOfSeq: number; values: Record<string, any> };
}

/** session/page 或 session/follow 的一条历史记录:原始事件或压缩的 chunk 序列。 */
export type SessionHistoryRecord =
  | { type: "event"; event: SessionEvent }
  | { type: "chunks"; event: SessionEvent };

// ---------- session/page / session/follow ----------

/** 会话或子代理会话的持久地址(0.1.2 起 history 改为按地址分页/跟随)。 */
export type SessionAddress =
  | { kind: "session"; sessionId: string }
  | { kind: "subagent"; parentSessionId: string; childSessionId: string; mode: "one-shot" | "continuable" };

export interface SessionPageRequest {
  address: SessionAddress;
  /** 来自对应 session/follow 打开帧的 cursor(含)。 */
  throughSeq: number;
  beforeSeq?: number;
  maxMessages?: number;
}

export interface SessionPageValue {
  records: SessionHistoryRecord[];
  hasMore: boolean;
}

/** session/follow 打开帧:完整基线,随后逐条会话事件。 */
export type SessionFollowFrame =
  | {
      type: "snapshot";
      header: {
        version: number;
        id: string;
        createdAt: number;
        cwd?: string;
        parentSession?: string;
        seedLength?: number;
        origin?: "subagent";
        delegationDepth?: number;
        agentPreset?: string;
      };
      cursor: number;
      records: SessionHistoryRecord[];
      hasMore: boolean;
      projections: { asOfSeq: number; values: Record<string, any> };
    }
  | { type: "event"; event: SessionEvent };

// ---------- session/control(0.1.2 起队列/任务/投影的单一控制流) ----------

export interface QueueItem {
  id: string;
  placement: "queued" | "steering" | "context";
  rpcId?: string;
  message: { id: string; content: unknown[] };
}

export interface JobView {
  id: string;
  kind: string;
  label: string;
  status: "running" | "stopping" | "completed" | "killed" | "failed";
  detail?: string;
  startedAt: number;
  finishedAt?: number;
}

export type SessionControlFrame =
  | {
      type: "baseline";
      value: {
        queues: Record<string, QueueItem[]>;
        jobs: Record<string, JobView[]>;
        projections: Record<string, { asOfSeq: number; values: Record<string, any> }>;
      };
    }
  | { type: "queue"; sessionId: string; items: QueueItem[] }
  | { type: "jobs"; sessionId: string; jobs: JobView[] }
  | { type: "projection"; sessionId: string; key: string; value: unknown; seq: number };

// ---------- workspace/follow(0.1.2 起工作区改走流) ----------

export interface WorkspaceItem {
  workspaceId: string;
  path: string;
  title: string;
  sessionIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type WorkspaceFollowFrame =
  | { type: "baseline"; value: { items: WorkspaceItem[]; archivedSessionIds: string[] } }
  | { type: "upsert"; workspace: WorkspaceItem }
  | { type: "remove"; workspaceId: string }
  | { type: "order"; workspaceIds: string[] }
  | { type: "archived"; archivedSessionIds: string[] };

// ---------- $events 主机事件流(0.1.2 起 host.describe / events.mux / events.host / /api/respond 的替代) ----------

/** $events 打开帧(ready)携带的客户端身份与主机信息。 */
export interface RemoteEventReady {
  type: "ready";
  clientId: string;
  host: { home: string };
}

export type RemoteEventFrame =
  | RemoteEventReady
  | { type: "emit"; event: string; args: unknown[] }
  | { type: "waterfall"; event: string; eventId: string; agentId: string; request: unknown }
  | { type: "cancel"; eventId: string };

/** 审批请求(approval/request waterfall 的 request)。 */
export interface ApprovalRequestEvent {
  toolName: string;
  callId?: string;
  reason?: string;
}

/** 提问请求(user-questions/request waterfall 的 request)。 */
export interface AskUserQuestionItem {
  id: string;
  question: string;
  header?: string;
  detail?: string;
  options?: { label: string; description?: string }[];
  multiSelect?: boolean;
  intent?: { kind: string; [key: string]: unknown };
}

export interface AskUserQuestionRequest {
  questions: AskUserQuestionItem[];
}

export interface AskUserQuestionAnswer {
  answers: { id: string; selected: string[]; custom?: string }[];
}

/** $events/result 的 outcome(回答 / 拒绝 / 让给下一个 answerer)。 */
export type RemoteEventOutcome =
  | { kind: "result"; value?: unknown }
  | { kind: "rejected"; error: { name: string; message: string; code?: string; details?: unknown } }
  | { kind: "next" };

// ---------- 一元方法请求/响应 ----------

export interface HostDescribeValue {
  version: string;
  cwd: string;
  provider?: string;
  model?: string;
  attachedSessions: number;
  canOpenPath: boolean;
}

export interface SessionCreateRequest {
  workspaceId?: string;
  cwd?: string;
  sessionId?: string;
  agentPreset?: string;
}
export interface SessionCreateValue {
  sessionId: string;
  agentPreset?: string;
}

export interface SessionHistoryRequest {
  address: SessionAddress;
  throughSeq: number;
  beforeSeq?: number;
  maxMessages?: number;
}
export interface SessionHistoryValue {
  records: SessionHistoryRecord[];
  hasMore: boolean;
}

export interface SessionPromptRequest {
  /** 客户端预生成的请求标识(0.1.2 起必需)。 */
  requestId: string;
  sessionId: string;
  mode: "queue" | "steer";
  content: PromptContentPart[];
  clientTimeZone?: string;
}
export interface SessionPromptValue {
  accepted: true;
}

/** commands/execute 网关返回的 CommandExecution 视图(命令结果文本透传界面)。 */
export interface CommandExecutionView {
  commandId?: string;
  result: { kind: "success" | "error"; text?: string };
}

export interface SessionListValue {
  items: SessionSummary[];
}

export interface ModelSelection {
  provider: string;
  model: string;
  reasoningEffort?: string;
}

export interface ModelReasoningEffort {
  id: string;
  name: string;
  description?: string;
}

export interface ModelReasoning {
  efforts: ModelReasoningEffort[];
  defaultEffort?: string;
}

export interface ModelCatalogModel {
  id: string;
  name: string;
  description?: string;
  reasoning?: ModelReasoning;
}

export interface ModelProviderGroup {
  id: string;
  name: string;
  models: ModelCatalogModel[];
}

export interface ModelCatalogFailure {
  id: string;
  name: string;
  message: string;
}

/** session/modelCatalog:0.1.2 起代替 session.models + llm.models。 */
export interface SessionModelsValue {
  current: ModelSelection;
  routable: boolean;
  groups: ModelProviderGroup[];
  failures: ModelCatalogFailure[];
}

export interface AgentPresetInfo {
  id: string;
  trust?: "system" | "user";
  isDefault: boolean;
  name?: string;
  description?: string;
  broken?: string;
}
export interface AgentPresetListValue {
  presets: AgentPresetInfo[];
  authorable: boolean;
}

// ---------- skills / subagents ----------

export interface SkillEntry {
  name: string;
  description: string;
  whenToUse?: string;
  modelInvocable: boolean;
}

export type SubagentEntry =
  | { kind: "child"; id: string; mode: "one-shot" | "continuable"; activity: "running" | "inactive"; hasChildren: boolean; label?: string }
  | { kind: "diagnostic"; id: string; reason: string };

// ---------- 工作区(workspace.* 请求/响应) ----------

export interface WorkspaceListValue {
  items: WorkspaceItem[];
  archivedSessionIds: string[];
}

// ---------- 会话内容搜索(session.search) ----------

export interface SessionSearchItem {
  sessionId: string;
  snippet: string;
}

export interface SessionSearchValue {
  items: SessionSearchItem[];
  hasMore: boolean;
}

// ---------- 图片内容块(session.prompt 的 image 部分) ----------

export interface ImageContentPart {
  type: "image";
  mediaType: string;
  data: string;
  name?: string;
}

export type PromptContentPart = { type: "text"; text: string } | ImageContentPart;

export interface SessionAttachmentValue {
  attachment: { id: string; mediaType?: string; name?: string; [key: string]: unknown };
  data: string;
}

// ---------- Agent 预设作者(agentPresets.*) ----------

export interface AgentPresetReadValue {
  agentPreset: string;
  trust: "system" | "user";
  content: string;
  name?: string;
  description?: string;
}

export interface AgentPresetOpenDocumentValue {
  opened: boolean;
  path?: string;
}

// ---------- 设置(settings.* / credentials.*;字段形状与 0.1.1 一致,端点改斜杠) ----------

export interface SettingsSecretView {
  path: string[];
  set: boolean;
}

export interface SettingsNamespaceView {
  ns: string;
  schema: unknown;
  value: unknown;
  base?: unknown;
  user?: unknown;
  applies: "live" | "restart";
  secrets: SettingsSecretView[];
  revision: number;
}

export interface SettingsDescribeValue {
  writable: boolean;
  hasDocument: boolean;
  namespaces: SettingsNamespaceView[];
}

export type SettingsPathOpView =
  | { op: "set"; path: string[]; value: unknown }
  | { op: "unset"; path: string[] };

export interface CredentialView {
  configured: boolean;
  source?: string;
  writable: boolean;
}

// ---------- LLM 目录(llm.* / session.modelCatalog) ----------

export interface ConfigurableProviderView {
  provider: string;
  displayName: string;
  settingsNs: string;
  settingsPath: string[];
  active: boolean;
  declared?: boolean;
}

export interface DiscoveredModelView {
  id: string;
  name?: string;
  contextWindow?: number;
  maxTokens?: number;
}

// ---------- 子代理追问/打断(subagents.*) ----------

export interface SubagentPromptReceipt {
  messageId: string;
}

// ---------- goal(goals.*:0.1.2 起 payload 为 {agentId, ref, request}) ----------

export interface GoalRef {
  id: string;
  revision: number;
}

export interface CreateGoalRequest {
  objective: string;
  maxGoalRounds?: number;
}

export interface CreateGoalResult {
  ref: GoalRef;
}

// ---------- 流式传输(remote.mux) ----------

export type RemoteMuxClientMessage =
  | { type: "open"; streamId: string; endpoint: string; payload: { args: unknown } }
  | { type: "cancel"; streamId: string };

export type RemoteMuxServerMessage =
  | { type: "item"; streamId: string; value: unknown }
  | { type: "end"; streamId: string }
  | { type: "error"; streamId: string; error: { code: string; message: string; details: unknown } };
