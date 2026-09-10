/** 补两个工具行标题键:产物 / 代码。 */
import fs from "node:fs";
import path from "node:path";

const textsDir = "D:/Workspace/vscode/src/webview/texts";

const KEYS = {
  "产物": {
    "zh-tw": "產物", ja: "成果物", ko: "산출물", de: "Artefakt",
    fr: "Livrable", es: "Entregable", pt: "Entregável", th: "ผลลัพธ์",
    id: "Hasil", tr: "Çıktı", ru: "Артефакт", ar: "مخرَج",
  },
  "代码": {
    "zh-tw": "程式碼", ja: "コード", ko: "코드", de: "Code",
    fr: "Code", es: "Código", pt: "Código", th: "โค้ด",
    id: "Kode", tr: "Kod", ru: "Код", ar: "تعليمات برمجية",
  },
};

for (const [lang, dict] of Object.entries(
  Object.keys(KEYS).reduce((acc, key) => {
    for (const [l, value] of Object.entries(KEYS[key])) {
      acc[l] = acc[l] ?? {};
      acc[l][key] = value;
    }
    return acc;
  }, {}),
)) {
  const file = path.join(textsDir, `${lang}.json`);
  const existing = JSON.parse(fs.readFileSync(file, "utf8"));
  let added = 0;
  for (const [key, value] of Object.entries(dict)) {
    if (existing[key] === undefined) {
      existing[key] = value;
      added++;
    }
  }
  fs.writeFileSync(file, `${JSON.stringify(existing, null, 2)}\n`, "utf8");
  console.log(`${lang}: +${added}`);
}
