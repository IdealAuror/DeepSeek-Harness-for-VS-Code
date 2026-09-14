/**
 * 会话统计胶囊(网页端 StatsPills / stat-dialog 同源)文案补齐 12 语言词典,
 * EN_TEXT(ui.ts 内的英文词典)由本脚本一并同步。
 */
import fs from "node:fs";
import path from "node:path";

const root = "D:/Workspace/vscode";
const textsDir = path.join(root, "src/webview/texts");
const uiFile = path.join(root, "src/webview/ui.ts");

const KEYS = {
  "{turns} 轮 {steps} 步": {
    en: "{turns} turns {steps} steps",
    "zh-tw": "{turns} 輪 {steps} 步", ja: "{turns} ターン {steps} ステップ", ko: "{turns} 턴 {steps} 단계",
    de: "{turns} Runden {steps} Schritte", fr: "{turns} tours {steps} étapes", es: "{turns} rondas {steps} pasos",
    pt: "{turns} rodadas {steps} etapas", th: "{turns} รอบ {steps} ขั้นตอน", id: "{turns} giliran {steps} langkah",
    tr: "{turns} tur {steps} adım", ru: "{turns} раундов {steps} шагов", ar: "{turns} جولة {steps} خطوة",
  },
  "会话统计": {
    en: "Session statistics",
    "zh-tw": "工作階段統計", ja: "セッション統計", ko: "세션 통계",
    de: "Sitzungsstatistik", fr: "Statistiques de session", es: "Estadísticas de sesión",
    pt: "Estatísticas da sessão", th: "สถิติเซสชัน", id: "Statistik sesi",
    tr: "Oturum istatistikleri", ru: "Статистика сессии", ar: "إحصاءات الجلسة",
  },
  "模型用时": {
    en: "LLM time",
    "zh-tw": "模型用時", ja: "モデル時間", ko: "모델 시간",
    de: "Modellzeit", fr: "Temps du modèle", es: "Tiempo del modelo",
    pt: "Tempo do modelo", th: "เวลาโมเดล", id: "Waktu model",
    tr: "Model süresi", ru: "Время модели", ar: "زمن النموذج",
  },
  "工具调用用时": {
    en: "Tool time",
    "zh-tw": "工具呼叫用時", ja: "ツール呼び出し時間", ko: "도구 호출 시간",
    de: "Werkzeugzeit", fr: "Temps des outils", es: "Tiempo de herramientas",
    pt: "Tempo de ferramentas", th: "เวลาเรียกเครื่องมือ", id: "Waktu panggilan alat",
    tr: "Araç çağrısı süresi", ru: "Время вызова инструментов", ar: "زمن استدعاء الأدوات",
  },
  "首 token 平均（TTFT）": {
    en: "Avg time to first token (TTFT)",
    "zh-tw": "首 token 平均(TTFT)", ja: "初回 token 平均(TTFT)", ko: "첫 token 평균(TTFT)",
    de: "Ø Zeit bis zum ersten Token (TTFT)", fr: "Temps moyen jusqu'au premier token (TTFT)",
    es: "Tiempo medio hasta el primer token (TTFT)", pt: "Tempo médio até o primeiro token (TTFT)",
    th: "เวลาเฉลี่ยถึง token แรก (TTFT)", id: "Rata-rata waktu token pertama (TTFT)",
    tr: "Ortalama ilk token süresi (TTFT)", ru: "Среднее время до первого токена (TTFT)",
    ar: "متوسط زمن أول token (TTFT)",
  },
  "Token 用量": {
    en: "Token usage",
    "zh-tw": "Token 用量", ja: "Token 使用量", ko: "Token 사용량",
    de: "Token-Nutzung", fr: "Utilisation des tokens", es: "Uso de tokens",
    pt: "Uso de tokens", th: "การใช้ token", id: "Penggunaan token",
    tr: "Token kullanımı", ru: "Использование токенов", ar: "استخدام الـ token",
  },
};

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
  for (const [key, value] of Object.entries(dict)) {
    if (existing[key] === undefined) {
      existing[key] = value;
      added++;
    }
  }
  fs.writeFileSync(file, `${JSON.stringify(existing, null, 2)}\n`, "utf8");
  console.log(`${lang}: +${added}`);
}

const anchor = '  "缓存命中 {p}%": "cache hit {p}%",';
let source = fs.readFileSync(uiFile, "utf8");
if (!source.includes(anchor)) throw new Error("EN_TEXT 锚点未找到");
let added = 0;
for (const [key, dict] of Object.entries(KEYS)) {
  const line = `  ${JSON.stringify(key)}: ${JSON.stringify(dict.en)},`;
  if (source.includes(`${JSON.stringify(key)}:`)) continue;
  source = source.replace(anchor, `${anchor}\n${line}`);
  added += 1;
}
fs.writeFileSync(uiFile, source, "utf8");
console.log(`EN_TEXT: +${added}`);
