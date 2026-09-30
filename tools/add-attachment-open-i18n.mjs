/**
 * 0.13.39:附件芯片可点击查看所需文案(Webview 词典,中文为源语言)
 * + 宿主 l10n(打开图片失败提示)。14 种语言全量补齐,只追加缺失键。
 */
import fs from "node:fs";
import path from "node:path";

const root = "D:/Workspace/vscode";

const WEBVIEW_KEYS = {
  "点击查看文件": {
    "zh-tw": "點擊檢視檔案", ja: "クリックで表示", ko: "클릭하여 보기", de: "Zum Ansehen klicken",
    fr: "Cliquer pour voir le fichier", es: "Haz clic para ver el archivo", pt: "Clique para ver o arquivo",
    th: "คลิกเพื่อดูไฟล์", id: "Klik untuk melihat berkas", tr: "Görüntülemek için tıklayın",
    ru: "Нажмите, чтобы открыть", ar: "انقر لعرض الملف",
  },
  "点击在资源管理器中显示": {
    "zh-tw": "點擊在檔案總管中顯示", ja: "クリックでエクスプローラーに表示", ko: "클릭하여 탐색기에 표시",
    de: "Zum Anzeigen im Explorer klicken", fr: "Cliquer pour révéler dans l'explorateur",
    es: "Haz clic para mostrar en el explorador", pt: "Clique para mostrar no explorador",
    th: "คลิกเพื่อแสดงในตัวจัดการไฟล์", id: "Klik untuk tampilkan di penjelajah",
    tr: "Dosya gezgininde göstermek için tıklayın", ru: "Нажмите, чтобы показать в проводнике",
    ar: "انقر للعرض في مستكشف الملفات",
  },
  "点击查看图片": {
    "zh-tw": "點擊檢視圖片", ja: "クリックで画像を表示", ko: "클릭하여 이미지 보기", de: "Zum Ansehen des Bildes klicken",
    fr: "Cliquer pour voir l'image", es: "Haz clic para ver la imagen", pt: "Clique para ver a imagem",
    th: "คลิกเพื่อดูรูปภาพ", id: "Klik untuk melihat gambar", tr: "Görseli görmek için tıklayın",
    ru: "Нажмите, чтобы посмотреть изображение", ar: "انقر لعرض الصورة",
  },
  "查看文件": {
    "zh-tw": "檢視檔案", ja: "ファイルを表示", ko: "파일 보기", de: "Datei ansehen",
    fr: "Voir le fichier", es: "Ver archivo", pt: "Ver arquivo", th: "ดูไฟล์",
    id: "Lihat berkas", tr: "Dosyayı görüntüle", ru: "Открыть файл", ar: "عرض الملف",
  },
  "先把图片保存为临时文件,再交给系统默认应用": {
    "zh-tw": "先把圖片存成暫存檔,再交給系統預設應用程式",
    ja: "画像を一時ファイルに保存してから、システムの既定アプリで開きます",
    ko: "이미지를 임시 파일로 저장한 뒤 시스템 기본 앱으로 엽니다",
    de: "Speichert das Bild als temporäre Datei und öffnet sie mit der Standard-App",
    fr: "Enregistre l'image dans un fichier temporaire, puis l'ouvre avec l'application par défaut",
    es: "Guarda la imagen en un archivo temporal y la abre con la aplicación predeterminada",
    pt: "Salva a imagem em um arquivo temporário e abre com o aplicativo padrão",
    th: "บันทึกรูปเป็นไฟล์ชั่วคราวแล้วเปิดด้วยแอปเริ่มต้นของระบบ",
    id: "Menyimpan gambar sebagai berkas sementara lalu membukanya dengan aplikasi default",
    tr: "Görseli geçici bir dosyaya kaydedip varsayılan uygulamayla açar",
    ru: "Сохраняет изображение во временный файл и открывает приложением по умолчанию",
    ar: "يحفظ الصورة في ملف مؤقت ثم يفتحها بالتطبيق الافتراضي",
  },
};

const L10N_EN = { "notice.openImageFailed": "Could not open the image: {error}" };
const L10N = {
  "zh-cn": { "notice.openImageFailed": "打开图片失败:{error}" },
  "zh-tw": { "notice.openImageFailed": "開啟圖片失敗:{error}" },
  ja: { "notice.openImageFailed": "画像を開けませんでした: {error}" },
  ko: { "notice.openImageFailed": "이미지를 열지 못했습니다: {error}" },
  de: { "notice.openImageFailed": "Bild konnte nicht geöffnet werden: {error}" },
  fr: { "notice.openImageFailed": "Impossible d'ouvrir l'image : {error}" },
  es: { "notice.openImageFailed": "No se pudo abrir la imagen: {error}" },
  pt: { "notice.openImageFailed": "Não foi possível abrir a imagem: {error}" },
  th: { "notice.openImageFailed": "เปิดรูปภาพไม่สำเร็จ: {error}" },
  id: { "notice.openImageFailed": "Gagal membuka gambar: {error}" },
  tr: { "notice.openImageFailed": "Görsel açılamadı: {error}" },
  ru: { "notice.openImageFailed": "Не удалось открыть изображение: {error}" },
  ar: { "notice.openImageFailed": "تعذّر فتح الصورة: {error}" },
};

let webviewAdded = 0;
const textsDir = path.join(root, "src/webview/texts");
for (const file of fs.readdirSync(textsDir)) {
  if (!file.endsWith(".json")) continue;
  const lang = file.replace(/\.json$/, "");
  const full = path.join(textsDir, file);
  const dict = JSON.parse(fs.readFileSync(full, "utf8"));
  let changed = false;
  for (const [key, byLang] of Object.entries(WEBVIEW_KEYS)) {
    if (dict[key] === undefined && byLang[lang] !== undefined) {
      dict[key] = byLang[lang];
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(full, `${JSON.stringify(dict, null, 2)}\n`, "utf8");
    webviewAdded++;
  }
}

let l10nAdded = 0;
const l10nDir = path.join(root, "l10n");
for (const file of fs.readdirSync(l10nDir)) {
  if (!/^bundle\.l10n(\.|$)/.test(file) || !file.endsWith(".json")) continue;
  const lang = file === "bundle.l10n.json" ? "en" : file.replace(/^bundle\.l10n\./, "").replace(/\.json$/, "");
  const dict = lang === "en" ? L10N_EN : L10N[lang];
  if (!dict) continue;
  const full = path.join(l10nDir, file);
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
    l10nAdded++;
  }
}
console.log(`webview dictionaries updated: ${webviewAdded}; l10n bundles updated: ${l10nAdded}`);
