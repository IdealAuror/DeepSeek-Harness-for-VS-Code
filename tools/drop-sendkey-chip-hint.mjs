/**
 * 0.13.36:发送键胶囊提示去掉「也可在设置面板中修改」(设置分区仍在,只是提示更短)。
 * 旧键连同 12 语言译文一起替换为新键。
 */
import fs from "node:fs";
import path from "node:path";

const root = "D:/Workspace/vscode";
const OLD = "当前:{current}。点击切换为「{next}」。也可在设置面板中修改。";
const NEW = "当前:{current}。点击切换为「{next}」。";

const NEW_TEXT = {
  "zh-tw": "目前:{current}。點擊切換為「{next}」。",
  ja: "現在: {current}。クリックで「{next}」に切り替え。",
  ko: "현재: {current}. 클릭하면 「{next}」(으)로 전환됩니다.",
  de: "Aktuell: {current}. Klicken wechselt zu „{next}“.",
  fr: "Actuel : {current}. Cliquez pour passer à « {next} ».",
  es: "Actual: {current}. Haz clic para cambiar a «{next}».",
  pt: "Atual: {current}. Clique para mudar para «{next}».",
  th: "ปัจจุบัน: {current} คลิกเพื่อสลับเป็น «{next}»",
  id: "Saat ini: {current}. Klik untuk beralih ke «{next}».",
  tr: "Geçerli: {current}. «{next}» için tıklayın.",
  ru: "Сейчас: {current}. Нажмите, чтобы переключить на «{next}».",
  ar: "الحالي: {current}. انقر للتبديل إلى «{next}».",
};

let changed = 0;
const textsDir = path.join(root, "src/webview/texts");
for (const file of fs.readdirSync(textsDir)) {
  if (!file.endsWith(".json")) continue;
  const lang = file.replace(/\.json$/, "");
  const full = path.join(textsDir, file);
  const dict = JSON.parse(fs.readFileSync(full, "utf8"));
  let touched = false;
  if (dict[OLD] !== undefined) {
    delete dict[OLD];
    touched = true;
  }
  if (dict[NEW] === undefined && NEW_TEXT[lang] !== undefined) {
    dict[NEW] = NEW_TEXT[lang];
    touched = true;
  }
  if (touched) {
    fs.writeFileSync(full, `${JSON.stringify(dict, null, 2)}\n`, "utf8");
    changed++;
  }
}
console.log(`dictionaries updated: ${changed}`);
