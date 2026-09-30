/**
 * 输入历史(↑/↓ 调回,issue #20)新增文案的本地化补齐。
 */
import fs from "node:fs";
import path from "node:path";

const root = "D:/Workspace/vscode";

const KEYS = {
  "历史 {index}/{total}": {
    "zh-tw": "歷史 {index}/{total}", ja: "履歴 {index}/{total}", ko: "기록 {index}/{total}", de: "Verlauf {index}/{total}",
    fr: "Historique {index}/{total}", es: "Historial {index}/{total}", pt: "Histórico {index}/{total}",
    th: "ประวัติ {index}/{total}", id: "Riwayat {index}/{total}", tr: "Geçmiş {index}/{total}",
    ru: "История {index}/{total}", ar: "السجل {index}/{total}",
  },
  "已是最早的输入": {
    "zh-tw": "已是最早的輸入", ja: "これが最も古い入力です", ko: "가장 오래된 입력입니다",
    de: "Älteste Eingabe erreicht", fr: "Première saisie atteinte", es: "Ya es la entrada más antigua",
    pt: "Já é a entrada mais antiga", th: "เป็นรายการแรกสุดแล้ว", id: "Sudah masukan paling awal",
    tr: "En eski girdidesiniz", ru: "Это самая ранняя запись", ar: "هذا أقدم إدخال",
  },
};

let updated = 0;
const dir = path.join(root, "src/webview/texts");
for (const file of fs.readdirSync(dir)) {
  if (!file.endsWith(".json")) continue;
  const lang = file.replace(/\.json$/, "");
  const full = path.join(dir, file);
  const dict = JSON.parse(fs.readFileSync(full, "utf8"));
  let changed = false;
  for (const [key, byLang] of Object.entries(KEYS)) {
    if (dict[key] === undefined && byLang[lang] !== undefined) {
      dict[key] = byLang[lang];
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(full, `${JSON.stringify(dict, null, 2)}\n`, "utf8");
    updated++;
  }
}
console.log(`webview dictionaries updated: ${updated}`);
