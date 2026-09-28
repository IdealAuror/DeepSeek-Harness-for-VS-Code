/**
 * 0.13.20:提交信息失败自证所需的新文案(三层 i18n 全量补齐)。
 * - 宿主 l10n:commit.diffStaged / commit.diffUnstaged / commit.onlyUntracked /
 *   带 {reason} {events} {messages} 占位符的 commit.empty;
 * - Webview 词典:一个都不会新增(本版本没有新的界面串)。
 * 只追加缺失键,不重排既有内容。
 */
import fs from "node:fs";
import path from "node:path";

const root = "D:/Workspace/vscode";

const L10N_EN = {
  "commit.diffStaged": "staged changes (index vs HEAD)",
  "commit.diffUnstaged": "unstaged changes (working tree vs index)",
  "commit.onlyUntracked":
    "DSH: nothing to generate from — {n} untracked file(s) are not part of a git diff. Stage them (git add) and try again.",
  "commit.empty":
    "DSH: the model returned no commit message (turn end: {reason}, {events} events, {messages} assistant messages).",
};

const L10N = {
  "zh-cn": {
    "commit.diffStaged": "已暂存改动(index vs HEAD)",
    "commit.diffUnstaged": "未暂存改动(工作区 vs index)",
    "commit.onlyUntracked": "DSH:没有可生成的内容——有 {n} 个未跟踪文件不属于 git diff,请先 git add 后重试。",
    "commit.empty": "DSH: 模型未返回有效提交信息(回合结束原因:{reason},事件 {events} 条,助手消息 {messages} 条)。",
  },
  "zh-tw": {
    "commit.diffStaged": "已暫存改動(index vs HEAD)",
    "commit.diffUnstaged": "未暫存改動(工作區 vs index)",
    "commit.onlyUntracked": "DSH:沒有可產生的內容——有 {n} 個未追蹤檔案不屬於 git diff,請先 git add 後重試。",
    "commit.empty": "DSH: 模型未回傳有效提交訊息(回合結束原因:{reason},事件 {events} 筆,助手訊息 {messages} 筆)。",
  },
  ja: {
    "commit.diffStaged": "ステージ済みの変更 (index vs HEAD)",
    "commit.diffUnstaged": "未ステージの変更 (working tree vs index)",
    "commit.onlyUntracked": "DSH: 生成できる内容がありません — {n} 個の未追跡ファイルは git diff に含まれません。git add してから再試行してください。",
    "commit.empty": "DSH: モデルが有効なコミットメッセージを返しませんでした(ターン終了理由: {reason}、イベント {events} 件、アシスタントメッセージ {messages} 件)。",
  },
  ko: {
    "commit.diffStaged": "스테이징된 변경 (index vs HEAD)",
    "commit.diffUnstaged": "스테이징되지 않은 변경 (working tree vs index)",
    "commit.onlyUntracked": "DSH: 생성할 내용이 없습니다 — 추적되지 않은 파일 {n}개는 git diff에 포함되지 않습니다. git add 후 다시 시도하세요.",
    "commit.empty": "DSH: 모델이 유효한 커밋 메시지를 반환하지 않았습니다(턴 종료 사유: {reason}, 이벤트 {events}개, 어시스턴트 메시지 {messages}개).",
  },
  de: {
    "commit.diffStaged": "bereitgestellte Änderungen (Index vs. HEAD)",
    "commit.diffUnstaged": "nicht bereitgestellte Änderungen (Arbeitsbaum vs. Index)",
    "commit.onlyUntracked": "DSH: nichts zu generieren — {n} nicht verfolgte Datei(en) sind nicht Teil eines git diff. Bitte zuerst git add ausführen.",
    "commit.empty": "DSH: Das Modell hat keine gültige Commit-Meldung geliefert (Turn-Ende: {reason}, {events} Ereignisse, {messages} Assistenten-Nachrichten).",
  },
  fr: {
    "commit.diffStaged": "modifications indexées (index vs HEAD)",
    "commit.diffUnstaged": "modifications non indexées (arbre de travail vs index)",
    "commit.onlyUntracked": "DSH : rien à générer — {n} fichier(s) non suivi(s) ne font pas partie d'un git diff. Faites git add puis réessayez.",
    "commit.empty": "DSH : le modèle n'a pas renvoyé de message de commit valide (fin de tour : {reason}, {events} événements, {messages} messages de l'assistant).",
  },
  es: {
    "commit.diffStaged": "cambios preparados (index vs HEAD)",
    "commit.diffUnstaged": "cambios sin preparar (árbol de trabajo vs index)",
    "commit.onlyUntracked": "DSH: no hay nada que generar — {n} archivo(s) sin seguimiento no forman parte de un git diff. Ejecuta git add y vuelve a intentarlo.",
    "commit.empty": "DSH: el modelo no devolvió un mensaje de commit válido (fin de turno: {reason}, {events} eventos, {messages} mensajes del asistente).",
  },
  pt: {
    "commit.diffStaged": "alterações preparadas (index vs HEAD)",
    "commit.diffUnstaged": "alterações não preparadas (árvore de trabalho vs index)",
    "commit.onlyUntracked": "DSH: nada para gerar — {n} arquivo(s) não rastreado(s) não fazem parte de um git diff. Execute git add e tente novamente.",
    "commit.empty": "DSH: o modelo não retornou uma mensagem de commit válida (fim do turno: {reason}, {events} eventos, {messages} mensagens do assistente).",
  },
  th: {
    "commit.diffStaged": "การเปลี่ยนแปลงที่ stage แล้ว (index vs HEAD)",
    "commit.diffUnstaged": "การเปลี่ยนแปลงที่ยังไม่ stage (working tree vs index)",
    "commit.onlyUntracked": "DSH: ไม่มีเนื้อหาให้สร้าง — ไฟล์ที่ยังไม่ถูกติดตาม {n} ไฟล์ไม่รวมอยู่ใน git diff กรุณา git add แล้วลองใหม่",
    "commit.empty": "DSH: โมเดลไม่ได้ส่งข้อความ commit ที่ใช้ได้ (เหตุจบเทิร์น: {reason}, อีเวนต์ {events}, ข้อความผู้ช่วย {messages})",
  },
  id: {
    "commit.diffStaged": "perubahan ter-staged (index vs HEAD)",
    "commit.diffUnstaged": "perubahan belum ter-staged (working tree vs index)",
    "commit.onlyUntracked": "DSH: tidak ada yang bisa dibuat — {n} berkas tak terlacak tidak termasuk dalam git diff. Jalankan git add lalu coba lagi.",
    "commit.empty": "DSH: model tidak mengembalikan pesan commit yang valid (akhir turn: {reason}, {events} peristiwa, {messages} pesan asisten).",
  },
  tr: {
    "commit.diffStaged": "hazırlanmış değişiklikler (index vs HEAD)",
    "commit.diffUnstaged": "hazırlanmamış değişiklikler (çalışma ağacı vs index)",
    "commit.onlyUntracked": "DSH: oluşturulacak içerik yok — {n} izlenmeyen dosya git diff'e dahil değil. Önce git add çalıştırıp yeniden deneyin.",
    "commit.empty": "DSH: model geçerli bir commit mesajı döndürmedi (tur bitişi: {reason}, {events} olay, {messages} asistan mesajı).",
  },
  ru: {
    "commit.diffStaged": "подготовленные изменения (index vs HEAD)",
    "commit.diffUnstaged": "неподготовленные изменения (рабочее дерево vs index)",
    "commit.onlyUntracked": "DSH: нечего генерировать — {n} неотслеживаемых файлов не входят в git diff. Выполните git add и повторите.",
    "commit.empty": "DSH: модель не вернула корректное сообщение коммита (причина завершения хода: {reason}, событий: {events}, сообщений ассистента: {messages}).",
  },
  ar: {
    "commit.diffStaged": "التغييرات المُهيّأة (index vs HEAD)",
    "commit.diffUnstaged": "التغييرات غير المُهيّأة (شجرة العمل vs index)",
    "commit.onlyUntracked": "DSH: لا يوجد محتوى للتوليد — {n} من الملفات غير المتعقَّبة ليست جزءًا من git diff. نفّذ git add ثم أعد المحاولة.",
    "commit.empty": "DSH: لم يُرجِع الطراز رسالة التزام صالحة (سبب انتهاء الدور: {reason}، الأحداث {events}، رسائل المساعد {messages}).",
  },
};

let changed = 0;
for (const file of fs.readdirSync(path.join(root, "l10n"))) {
  if (!/^bundle\.l10n(\.|$)/.test(file) || !file.endsWith(".json")) continue;
  const lang = file === "bundle.l10n.json" ? "en" : file.replace(/^bundle\.l10n\./, "").replace(/\.json$/, "");
  const dict = lang === "en" ? L10N_EN : L10N[lang];
  if (!dict) continue;
  const full = path.join(root, "l10n", file);
  const json = JSON.parse(fs.readFileSync(full, "utf8"));
  let touched = false;
  for (const [key, value] of Object.entries(dict)) {
    if (json[key] === undefined) {
      json[key] = value;
      touched = true;
    }
  }
  if (touched) {
    fs.writeFileSync(full, `${JSON.stringify(json, null, 2)}\n`, "utf8");
    changed++;
  }
}
console.log(`l10n bundles updated: ${changed}`);
