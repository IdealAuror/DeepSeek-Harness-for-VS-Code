/**
 * issue #21 采纳项的新增界面文案:发送快捷键提示行(两种模式)+ 多行编辑提示。
 */
import fs from "node:fs";
import path from "node:path";

const root = "D:/Workspace/vscode";

const KEYS = {
  "Ctrl+Enter 发送 · Enter 换行": {
    "zh-tw": "Ctrl+Enter 傳送 · Enter 換行",
    ja: "Ctrl+Enter で送信 · Enter で改行",
    ko: "Ctrl+Enter 전송 · Enter 줄바꿈",
    de: "Ctrl+Enter sendet · Enter bricht um",
    fr: "Ctrl+Entrée envoie · Entrée saute une ligne",
    es: "Ctrl+Enter envía · Enter salta de línea",
    pt: "Ctrl+Enter envia · Enter quebra a linha",
    th: "Ctrl+Enter ส่ง · Enter ขึ้นบรรทัดใหม่",
    id: "Ctrl+Enter mengirim · Enter baris baru",
    tr: "Ctrl+Enter gönderir · Enter satır atlar",
    ru: "Ctrl+Enter отправляет · Enter переносит строку",
    ar: "Ctrl+Enter يُرسل · Enter سطر جديد",
  },
  "Shift+Enter 发送 · Enter 换行": {
    "zh-tw": "Shift+Enter 傳送 · Enter 換行",
    ja: "Shift+Enter で送信 · Enter で改行",
    ko: "Shift+Enter 전송 · Enter 줄바꿈",
    de: "Shift+Enter sendet · Enter bricht um",
    fr: "Maj+Entrée envoie · Entrée saute une ligne",
    es: "Mayús+Enter envía · Enter salta de línea",
    pt: "Shift+Enter envia · Enter quebra a linha",
    th: "Shift+Enter ส่ง · Enter ขึ้นบรรทัดใหม่",
    id: "Shift+Enter mengirim · Enter baris baru",
    tr: "Shift+Enter gönderir · Enter satır atlar",
    ru: "Shift+Enter отправляет · Enter переносит строку",
    ar: "Shift+Enter يُرسل · Enter سطر جديد",
  },
  "Shift/Ctrl+Enter 确认 · Esc 取消": {
    "zh-tw": "Shift/Ctrl+Enter 確認 · Esc 取消",
    ja: "Shift/Ctrl+Enter で確定 · Esc でキャンセル",
    ko: "Shift/Ctrl+Enter 확인 · Esc 취소",
    de: "Shift/Ctrl+Enter bestätigt · Esc bricht ab",
    fr: "Maj/Ctrl+Entrée valide · Échap annule",
    es: "Mayús/Ctrl+Enter confirma · Esc cancela",
    pt: "Shift/Ctrl+Enter confirma · Esc cancela",
    th: "Shift/Ctrl+Enter ยืนยัน · Esc ยกเลิก",
    id: "Shift/Ctrl+Enter konfirmasi · Esc batal",
    tr: "Shift/Ctrl+Enter onaylar · Esc iptal",
    ru: "Shift/Ctrl+Enter подтверждает · Esc отменяет",
    ar: "Shift/Ctrl+Enter للتأكيد · Esc للإلغاء",
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
