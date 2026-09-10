/**
 * 回合尾统计(用量 / 用时 / 时间)与交付文件卡新增词典键。
 * 文案与网页端同名键(message.turnUsage.* / message.turnTime.* / message.ranFor /
 * duration.* / clock.* / presented.*)对齐。
 */
import fs from "node:fs";
import path from "node:path";

const textsDir = "D:/Workspace/vscode/src/webview/texts";

const KEYS = {
  "本轮用量": {
    "zh-tw": "本輪用量", ja: "今回の使用量", ko: "이번 턴 사용량", de: "Nutzung dieser Runde",
    fr: "Usage du tour", es: "Uso del turno", pt: "Uso do turno", th: "การใช้ของเทิร์นนี้",
    id: "Penggunaan turn", tr: "Tur kullanımı", ru: "Расход за ход", ar: "استخدام الدور",
  },
  "用量 {total}": {
    "zh-tw": "用量 {total}", ja: "使用量 {total}", ko: "사용량 {total}", de: "Verbrauch {total}",
    fr: "Utilisé {total}", es: "Uso {total}", pt: "Uso {total}", th: "ใช้ไป {total}",
    id: "Terpakai {total}", tr: "Kullanım {total}", ru: "Использовано {total}", ar: "الاستخدام {total}",
  },
  "提供方 / 模型": {
    "zh-tw": "提供者 / 模型", ja: "プロバイダー / モデル", ko: "제공자 / 모델", de: "Anbieter / Modell",
    fr: "Fournisseur / modèle", es: "Proveedor / modelo", pt: "Provedor / modelo", th: "ผู้ให้บริการ / โมเดล",
    id: "Penyedia / model", tr: "Sağlayıcı / model", ru: "Провайдер / модель", ar: "المزوّد / الطراز",
  },
  "缓存命中": {
    "zh-tw": "快取命中", ja: "キャッシュヒット", ko: "캐시 적중", de: "Cache-Treffer",
    fr: "Cache hits", es: "Aciertos de caché", pt: "Acertos de cache", th: "ฮิตแคช",
    id: "Cache hit", tr: "Önbellek isabeti", ru: "Попаданий в кэш", ar: "إصابة الذاكرة المؤقتة",
  },
  "未缓存输入": {
    "zh-tw": "未快取輸入", ja: "未キャッシュ入力", ko: "미캐시 입력", de: "Ungecachte Eingabe",
    fr: "Entrée non cachée", es: "Entrada sin caché", pt: "Entrada não cacheada", th: "อินพุตที่ไม่แคช",
    id: "Masukan tanpa cache", tr: "Önbelleksiz girdi", ru: "Некэшированный ввод", ar: "إدخال غير مخزّن",
  },
  "缓存读取": {
    "zh-tw": "快取讀取", ja: "キャッシュ読み取り", ko: "캐시 읽기", de: "Cache-Lesevorgänge",
    fr: "Lectures de cache", es: "Lecturas de caché", pt: "Leituras de cache", th: "การอ่านแคช",
    id: "Baca cache", tr: "Önbellek okuma", ru: "Чтений из кэша", ar: "قراءات الذاكرة المؤقتة",
  },
  "缓存写入": {
    "zh-tw": "快取寫入", ja: "キャッシュ書き込み", ko: "캐시 쓰기", de: "Cache-Schreibvorgänge",
    fr: "Écritures de cache", es: "Escrituras de caché", pt: "Gravações de cache", th: "การเขียนแคช",
    id: "Tulis cache", tr: "Önbellek yazma", ru: "Записей в кэш", ar: "كتابات الذاكرة المؤقتة",
  },
  "输出": {
    "zh-tw": "輸出", ja: "出力", ko: "출력", de: "Ausgabe",
    fr: "Sortie", es: "Salida", pt: "Saída", th: "เอาต์พุต",
    id: "Keluaran", tr: "Çıktı", ru: "Вывод", ar: "الإخراج",
  },
  "（其中推理 {tokens}）": {
    "zh-tw": "（其中推理 {tokens}）", ja: "（うち推論 {tokens}）", ko: "（추론 {tokens} 포함）", de: " ({tokens} Reasoning)",
    fr: " (dont {tokens} de raisonnement)", es: " (de los cuales {tokens} de razonamiento)", pt: " (dos quais {tokens} de raciocínio)", th: " (การให้เหตุผล {tokens})",
    id: " ({tokens} penalaran)", tr: " ({tokens} akıl yürütme)", ru: " (из них {tokens} рассуждений)", ar: " (منها {tokens} استدلال)",
  },
  "本轮用时和速度": {
    "zh-tw": "本輪用時與速度", ja: "今回の所要時間と速度", ko: "이번 턴 소요 시간과 속도", de: "Dauer und Geschwindigkeit dieser Runde",
    fr: "Durée et vitesse du tour", es: "Duración y velocidad del turno", pt: "Duração e velocidade do turno", th: "เวลาและความเร็วของเทิร์นนี้",
    id: "Waktu dan kecepatan turn", tr: "Tur süresi ve hızı", ru: "Время и скорость хода", ar: "مدة الدور وسرعته",
  },
  "本轮总用时": {
    "zh-tw": "本輪總用時", ja: "今回の総所要時間", ko: "이번 턴 총 소요 시간", de: "Gesamtdauer dieser Runde",
    fr: "Durée totale du tour", es: "Duración total del turno", pt: "Duração total do turno", th: "เวลารวมของเทิร์นนี้",
    id: "Total waktu turn", tr: "Toplam tur süresi", ru: "Общее время хода", ar: "إجمالي مدة الدور",
  },
  "输出速度（TPS）": {
    "zh-tw": "輸出速度(TPS)", ja: "出力速度(TPS)", ko: "출력 속도(TPS)", de: "Ausgabegeschwindigkeit (TPS)",
    fr: "Vitesse de sortie (TPS)", es: "Velocidad de salida (TPS)", pt: "Velocidade de saída (TPS)", th: "ความเร็วเอาต์พุต (TPS)",
    id: "Kecepatan keluaran (TPS)", tr: "Çıktı hızı (TPS)", ru: "Скорость вывода (TPS)", ar: "سرعة الإخراج (TPS)",
  },
  "首 token 用时（TTFT）": {
    "zh-tw": "首 token 用時(TTFT)", ja: "初回 token までの時間(TTFT)", ko: "첫 token 소요 시간(TTFT)", de: "Zeit bis zum ersten Token (TTFT)",
    fr: "Temps jusqu'au premier token (TTFT)", es: "Tiempo hasta el primer token (TTFT)", pt: "Tempo até o primeiro token (TTFT)", th: "เวลาถึง token แรก (TTFT)",
    id: "Waktu token pertama (TTFT)", tr: "İlk token süresi (TTFT)", ru: "Время до первого токена (TTFT)", ar: "زمن أول token (TTFT)",
  },
  "{tps} tok/s": {
    "zh-tw": "{tps} tok/s", ja: "{tps} tok/s", ko: "{tps} tok/s", de: "{tps} tok/s",
    fr: "{tps} tok/s", es: "{tps} tok/s", pt: "{tps} tok/s", th: "{tps} tok/s",
    id: "{tps} tok/s", tr: "{tps} tok/s", ru: "{tps} tok/s", ar: "{tps} tok/s",
  },
  "用时 {duration}": {
    "zh-tw": "用時 {duration}", ja: "所要時間 {duration}", ko: "소요 시간 {duration}", de: "Dauer {duration}",
    fr: "Durée {duration}", es: "Duración {duration}", pt: "Duração {duration}", th: "ใช้เวลา {duration}",
    id: "Durasi {duration}", tr: "Süre {duration}", ru: "Время {duration}", ar: "المدة {duration}",
  },
  "{minutes}分{seconds}秒": {
    "zh-tw": "{minutes}分{seconds}秒", ja: "{minutes}分{seconds}秒", ko: "{minutes}분 {seconds}초", de: "{minutes}m {seconds}s",
    fr: "{minutes} min {seconds} s", es: "{minutes} min {seconds} s", pt: "{minutes} min {seconds} s", th: "{minutes} นาที {seconds} วินาที",
    id: "{minutes}m {seconds}d", tr: "{minutes}dk {seconds}sn", ru: "{minutes} мин {seconds} с", ar: "{minutes} د {seconds} ث",
  },
  "{seconds}秒": {
    "zh-tw": "{seconds}秒", ja: "{seconds}秒", ko: "{seconds}초", de: "{seconds}s",
    fr: "{seconds} s", es: "{seconds} s", pt: "{seconds} s", th: "{seconds} วินาที",
    id: "{seconds}d", tr: "{seconds}sn", ru: "{seconds} с", ar: "{seconds} ث",
  },
  "{m}月{d}日": {
    "zh-tw": "{m}月{d}日", ja: "{m}月{d}日", ko: "{m}월 {d}일", de: "{d}.{m}.",
    fr: "{d}/{m}", es: "{d}/{m}", pt: "{d}/{m}", th: "{d}/{m}",
    id: "{d}/{m}", tr: "{d}.{m}", ru: "{d}.{m}", ar: "{d}/{m}",
  },
  "{y}年{m}月{d}日": {
    "zh-tw": "{y}年{m}月{d}日", ja: "{y}年{m}月{d}日", ko: "{y}년 {m}월 {d}일", de: "{d}.{m}.{y}",
    fr: "{d}/{m}/{y}", es: "{d}/{m}/{y}", pt: "{d}/{m}/{y}", th: "{d}/{m}/{y}",
    id: "{d}/{m}/{y}", tr: "{d}.{m}.{y}", ru: "{d}.{m}.{y}", ar: "{d}/{m}/{y}",
  },
  "用默认应用打开": {
    "zh-tw": "用預設應用程式開啟", ja: "既定のアプリで開く", ko: "기본 앱으로 열기", de: "Mit Standard-App öffnen",
    fr: "Ouvrir avec l'application par défaut", es: "Abrir con la aplicación predeterminada", pt: "Abrir com o aplicativo padrão",
    th: "เปิดด้วยแอปเริ่มต้น", id: "Buka dengan aplikasi default", tr: "Varsayılan uygulamayla aç",
    ru: "Открыть в приложении по умолчанию", ar: "فتح بالتطبيق الافتراضي",
  },
  "更多操作": {
    "zh-tw": "更多操作", ja: "その他の操作", ko: "추가 작업", de: "Weitere Aktionen",
    fr: "Plus d'actions", es: "Más acciones", pt: "Mais ações", th: "การดำเนินการเพิ่มเติม",
    id: "Tindakan lain", tr: "Diğer işlemler", ru: "Другие действия", ar: "إجراءات أخرى",
  },
  "文件": {
    "zh-tw": "檔案", ja: "ファイル", ko: "파일", de: "Datei",
    fr: "Fichier", es: "Archivo", pt: "Arquivo", th: "ไฟล์",
    id: "Berkas", tr: "Dosya", ru: "Файл", ar: "ملف",
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
