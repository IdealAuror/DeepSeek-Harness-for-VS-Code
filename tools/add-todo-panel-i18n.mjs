/**
 * 任务清单改为网页端 TodoPanel 风格后新增四条词典键:
 *   "任务" / "{n} 已完成" / "{n} 进行中" / "{n} 待处理"
 * (与网页端 todo.title / todo.progress.* 文案一致;非零状态用 · 连接)
 * 插入点:旧的合并键 "☑ 任务 · {a} 进行中 · {b} 待处理" 之后。
 */
import fs from "node:fs";
import path from "node:path";

const textsDir = "D:/Workspace/vscode/src/webview/texts";

const TRANSLATIONS = {
  "zh-tw": { title: "任務", done: "{n} 已完成", active: "{n} 進行中", pending: "{n} 待處理" },
  ja: { title: "タスク", done: "{n} 完了", active: "{n} 進行中", pending: "{n} 保留中" },
  ko: { title: "작업", done: "{n} 완료", active: "{n} 진행 중", pending: "{n} 대기 중" },
  de: { title: "Aufgaben", done: "{n} abgeschlossen", active: "{n} in Arbeit", pending: "{n} ausstehend" },
  fr: { title: "Tâches", done: "{n} terminées", active: "{n} en cours", pending: "{n} en attente" },
  es: { title: "Tareas", done: "{n} completadas", active: "{n} en curso", pending: "{n} pendientes" },
  pt: { title: "Tarefas", done: "{n} concluídas", active: "{n} em andamento", pending: "{n} pendentes" },
  th: { title: "งาน", done: "{n} เสร็จแล้ว", active: "{n} กำลังดำเนินการ", pending: "{n} รอดำเนินการ" },
  id: { title: "Tugas", done: "{n} selesai", active: "{n} berjalan", pending: "{n} tertunda" },
  tr: { title: "Görevler", done: "{n} tamamlandı", active: "{n} sürüyor", pending: "{n} bekliyor" },
  ru: { title: "Задачи", done: "{n} выполнено", active: "{n} выполняется", pending: "{n} ожидает" },
  ar: { title: "المهام", done: "{n} مكتملة", active: "{n} قيد التنفيذ", pending: "{n} معلّقة" },
};

const ANCHOR = "☑ 任务 · {a} 进行中 · {b} 待处理";

for (const [lang, copy] of Object.entries(TRANSLATIONS)) {
  const file = path.join(textsDir, `${lang}.json`);
  const dict = JSON.parse(fs.readFileSync(file, "utf8"));
  if (dict["任务"] !== undefined && dict["{n} 已完成"] !== undefined) {
    console.log(`${lang}: already present`);
    continue;
  }
  const ordered = {};
  for (const [key, value] of Object.entries(dict)) {
    if (key === ANCHOR) continue; // 旧合并键已由四段式摘要取代
    ordered[key] = value;
    if (key === "系统提示词") {
      ordered["任务"] = copy.title;
      ordered["{n} 已完成"] = copy.done;
      ordered["{n} 进行中"] = copy.active;
      ordered["{n} 待处理"] = copy.pending;
    }
  }
  fs.writeFileSync(file, `${JSON.stringify(ordered, null, 2)}\n`, "utf8");
  console.log(`${lang}: inserted`);
}
