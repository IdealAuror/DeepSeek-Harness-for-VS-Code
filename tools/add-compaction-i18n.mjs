/**
 * 压缩上下文命令行(网页端 CompactionItem 同源)文案补齐 12 语言词典;
 * 同时移除已废弃的旧提示(压缩改为"点击即执行"),EN_TEXT 由本脚本一并同步。
 */
import fs from "node:fs";
import path from "node:path";

const root = "D:/Workspace/vscode";
const textsDir = path.join(root, "src/webview/texts");
const uiFile = path.join(root, "src/webview/ui.ts");

const KEYS = {
  "正在压缩上下文…": {
    en: "Compacting context…",
    "zh-tw": "正在壓縮上下文…", ja: "コンテキストを圧縮中…", ko: "컨텍스트 압축 중…",
    de: "Kontext wird komprimiert…", fr: "Compression du contexte…", es: "Compactando el contexto…",
    pt: "Compactando o contexto…", th: "กำลังบีบอัดบริบท…", id: "Memadatkan konteks…",
    tr: "Bağlam sıkıştırılıyor…", ru: "Сжатие контекста…", ar: "جارٍ ضغط السياق…",
  },
  "已压缩 {items} 条历史记录(约 {tokens} tokens)": {
    en: "Compacted {items} history items (~{tokens} tokens)",
    "zh-tw": "已壓縮 {items} 條歷史記錄(約 {tokens} tokens)",
    ja: "{items} 件の履歴を圧縮しました(約 {tokens} tokens)",
    ko: "기록 {items}개를 압축했습니다(약 {tokens} tokens)",
    de: "{items} Verlaufseinträge komprimiert (~{tokens} Tokens)",
    fr: "{items} éléments d'historique compressés (~{tokens} tokens)",
    es: "{items} elementos de historial compactados (~{tokens} tokens)",
    pt: "{items} itens de histórico compactados (~{tokens} tokens)",
    th: "บีบอัดประวัติ {items} รายการ (ประมาณ {tokens} tokens)",
    id: "{items} item riwayat dipadatkan (~{tokens} token)",
    tr: "{items} geçmiş öğesi sıkıştırıldı (~{tokens} tokens)",
    ru: "Сжато элементов истории: {items} (~{tokens} tokens)",
    ar: "تم ضغط {items} عنصرًا من السجل (~{tokens} tokens)",
  },
  "上下文已压缩": {
    en: "Context compacted",
    "zh-tw": "上下文已壓縮", ja: "コンテキストを圧縮しました", ko: "컨텍스트가 압축됨",
    de: "Kontext komprimiert", fr: "Contexte compressé", es: "Contexto compactado",
    pt: "Contexto compactado", th: "บีบอัดบริบทแล้ว", id: "Konteks dipadatkan",
    tr: "Bağlam sıkıştırıldı", ru: "Контекст сжат", ar: "تم ضغط السياق",
  },
  "点击展开压缩摘要": {
    en: "Click to view the compaction summary",
    "zh-tw": "點擊展開壓縮摘要", ja: "クリックして圧縮サマリーを表示", ko: "클릭하여 압축 요약 보기",
    de: "Klicken, um die Komprimierungszusammenfassung zu öffnen",
    fr: "Cliquez pour afficher le résumé de compression",
    es: "Haz clic para ver el resumen de compactación",
    pt: "Clique para ver o resumo da compactação", th: "คลิกเพื่อดูสรุปการบีบอัด",
    id: "Klik untuk melihat ringkasan pemadatan", tr: "Sıkıştırma özetini görmek için tıklayın",
    ru: "Нажмите, чтобы открыть сводку сжатия", ar: "انقر لعرض ملخص الضغط",
  },
  "压缩摘要不可用": {
    en: "Compaction summary unavailable",
    "zh-tw": "壓縮摘要不可用", ja: "圧縮サマリーは利用できません", ko: "압축 요약을 사용할 수 없음",
    de: "Komprimierungszusammenfassung nicht verfügbar",
    fr: "Résumé de compression indisponible", es: "Resumen de compactación no disponible",
    pt: "Resumo da compactação indisponível", th: "ไม่มีสรุปการบีบอัด",
    id: "Ringkasan pemadatan tidak tersedia", tr: "Sıkıştırma özeti kullanılamıyor",
    ru: "Сводка сжатия недоступна", ar: "ملخص الضغط غير متاح",
  },
  "命令": {
    en: "Command",
    "zh-tw": "命令", ja: "コマンド", ko: "명령", de: "Befehl",
    fr: "Commande", es: "Comando", pt: "Comando", th: "คำสั่ง",
    id: "Perintah", tr: "Komut", ru: "Команда", ar: "أمر",
  },
  "立即执行 /compact;压缩进度显示在对话中": {
    en: "Run /compact immediately; progress appears in the conversation",
    "zh-tw": "立即執行 /compact;壓縮進度顯示在對話中",
    ja: "すぐに /compact を実行。進捗は会話内に表示されます",
    ko: "/compact를 즉시 실행합니다. 진행 상황은 대화에 표시됩니다",
    de: "/compact sofort ausführen; Fortschritt erscheint im Verlauf",
    fr: "Exécuter /compact immédiatement ; la progression s'affiche dans la conversation",
    es: "Ejecutar /compact de inmediato; el progreso aparece en la conversación",
    pt: "Executar /compact imediatamente; o progresso aparece na conversa",
    th: "เรียกใช้ /compact ทันที ความคืบหน้าจะแสดงในบทสนทนา",
    id: "Jalankan /compact segera; kemajuan tampil di percakapan",
    tr: "/compact hemen çalıştırılır; ilerleme sohbette görünür",
    ru: "Сразу выполнить /compact; ход сжатия отображается в диалоге",
    ar: "تشغيل /compact فورًا؛ يظهر التقدم في المحادثة",
  },
};

const OBSOLETE = ["插入 /compact 到输入框,回车执行"];

const byLang = {};
for (const [key, dict] of Object.entries(KEYS)) {
  for (const [lang, value] of Object.entries(dict)) {
    if (lang === "en") continue;
    byLang[lang] = byLang[lang] ?? {};
    byLang[lang][key] = value;
  }
}

for (const [lang, dict] of Object.entries(byLang)) {
  const file = path.join(textsDir, `${lang}.json`);
  const existing = JSON.parse(fs.readFileSync(file, "utf8"));
  let added = 0;
  let removed = 0;
  for (const [key, value] of Object.entries(dict)) {
    if (existing[key] === undefined) {
      existing[key] = value;
      added++;
    }
  }
  for (const key of OBSOLETE) {
    if (existing[key] !== undefined) {
      delete existing[key];
      removed++;
    }
  }
  fs.writeFileSync(file, `${JSON.stringify(existing, null, 2)}\n`, "utf8");
  console.log(`${lang}: +${added} -${removed}`);
}

// EN_TEXT(ui.ts 内的英文词典)同步:新增英文键,移除废弃键
let source = fs.readFileSync(uiFile, "utf8");
const anchor = '  "压缩上下文": "Compact context",';
if (!source.includes(anchor)) throw new Error("EN_TEXT 锚点未找到");
const enLines = Object.entries(KEYS).map(([key, dict]) => `  ${JSON.stringify(key)}: ${JSON.stringify(dict.en)},`);
let inserted = false;
for (const line of enLines) {
  const key = line.trim().split(":")[0];
  if (source.includes(`${key}:`)) continue;
  source = source.replace(anchor, `${anchor}\n${line}`);
  inserted = true;
}
for (const key of OBSOLETE) {
  const re = new RegExp(`^\\s*${JSON.stringify(key).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:.*\\n`, "m");
  source = source.replace(re, "");
}
fs.writeFileSync(uiFile, source, "utf8");
console.log(`EN_TEXT: ${inserted ? "已补齐" : "无新增"}; 废弃键已清理`);
