/**
 * 为上下文进度环新增三条词典键(桌面端 l10n 与网页端词典同步):
 *   "工具定义" / "对话消息" / "上下文已用 {p}"
 * 以 "系统提示词" 之后为插入点,保持与既有词典相同的排布风格。
 * 同时补齐两条此前只在源码中出现的图片附件提示(EN_TEXT + 全部语言词典)。
 */
import fs from "node:fs";
import path from "node:path";

const textsDir = "D:/Workspace/vscode/src/webview/texts";

/** 各语言译文(zh-cn 为源语言,不落盘)。 */
const TRANSLATIONS = {
  "zh-tw": { tools: "工具定義", messages: "對話訊息", used: "上下文已用 {p}" },
  ja: { tools: "ツール定義", messages: "会話メッセージ", used: "コンテキスト使用 {p}" },
  ko: { tools: "도구 정의", messages: "대화 메시지", used: "컨텍스트 사용 {p}" },
  de: { tools: "Werkzeugdefinitionen", messages: "Nachrichten", used: "{p} des Kontexts verwendet" },
  fr: { tools: "Définitions d'outils", messages: "Messages", used: "{p} du contexte utilisé" },
  es: { tools: "Definiciones de herramientas", messages: "Mensajes", used: "{p} del contexto usado" },
  pt: { tools: "Definições de ferramentas", messages: "Mensagens", used: "{p} do contexto usado" },
  th: { tools: "คำจำกัดความเครื่องมือ", messages: "ข้อความสนทนา", used: "ใช้บริบทไปแล้ว {p}" },
  id: { tools: "Definisi alat", messages: "Pesan percakapan", used: "{p} konteks terpakai" },
  tr: { tools: "Araç tanımları", messages: "Mesajlar", used: "Bağlamın {p} kadarı kullanıldı" },
  ru: { tools: "Определения инструментов", messages: "Сообщения", used: "Использовано {p} контекста" },
  ar: { tools: "تعريفات الأدوات", messages: "رسائل المحادثة", used: "تم استخدام {p} من السياق" },
};

/** 图片附件提示(两条此前缺翻译的键)。 */
const IMAGE_KEYS = {
  "⚠️ 最多一次添加 8 张图片": {
    "zh-tw": "⚠️ 最多一次加入 8 張圖片",
    ja: "⚠️ 画像は一度に最大 8 枚まで追加できます",
    ko: "⚠️ 이미지는 한 번에 최대 8장까지 추가할 수 있습니다",
    de: "⚠️ Es können höchstens 8 Bilder auf einmal hinzugefügt werden",
    fr: "⚠️ Vous pouvez ajouter jusqu'à 8 images à la fois",
    es: "⚠️ Puedes añadir hasta 8 imágenes a la vez",
    pt: "⚠️ Pode adicionar no máximo 8 imagens de uma vez",
    th: "⚠️ เพิ่มรูปภาพได้ครั้งละไม่เกิน 8 รูป",
    id: "⚠️ Maksimal 8 gambar sekaligus",
    tr: "⚠️ Tek seferde en fazla 8 görsel eklenebilir",
    ru: "⚠️ За раз можно добавить не более 8 изображений",
    ar: "⚠️ يمكن إضافة 8 صور كحد أقصى في المرة الواحدة",
  },
  "⚠️ 非图片附件请从资源管理器复制(未提供本地路径)": {
    "zh-tw": "⚠️ 非圖片附件請從檔案總管複製(未提供本機路徑)",
    ja: "⚠️ 画像以外の添付はエクスプローラーからコピーしてください(ローカルパスがありません)",
    ko: "⚠️ 이미지가 아닌 첨부는 파일 탐색기에서 복사하세요(로컬 경로 없음)",
    de: "⚠️ Nicht-Bild-Anhänge aus dem Datei-Explorer kopieren (kein lokaler Pfad vorhanden)",
    fr: "⚠️ Copiez les pièces jointes non-images depuis l'explorateur de fichiers (aucun chemin local fourni)",
    es: "⚠️ Copia los archivos adjuntos que no sean imágenes desde el explorador de archivos (no se proporcionó una ruta local)",
    pt: "⚠️ Copie anexos que não sejam imagens do explorador de arquivos (nenhum caminho local fornecido)",
    th: "⚠️ คัดลอกไฟล์แนบที่ไม่ใช่รูปภาพจากตัวจัดการไฟล์ (ไม่มีเส้นทางในเครื่อง)",
    id: "⚠️ Salin lampiran non-gambar dari File Explorer (tidak ada jalur lokal)",
    tr: "⚠️ Görsel olmayan ekleri dosya gezgininden kopyalayın (yerel yol yok)",
    ru: "⚠️ Копируйте вложения, не являющиеся изображениями, из проводника (локальный путь не указан)",
    ar: "⚠️ انسخ المرفقات غير المصوّرة من مستكشف الملفات (لا يوجد مسار محلي)",
  },
};

const ANCHOR = "系统提示词";

for (const [lang, copy] of Object.entries(TRANSLATIONS)) {
  const file = path.join(textsDir, `${lang}.json`);
  const dict = JSON.parse(fs.readFileSync(file, "utf8"));
  if (dict["工具定义"] !== undefined && dict["⚠️ 最多一次添加 8 张图片"] !== undefined) {
    console.log(`${lang}: already present`);
    continue;
  }
  // 重建顺序:新键放到锚点之后,其余保持原顺序
  const ordered = {};
  for (const [key, value] of Object.entries(dict)) {
    ordered[key] = value;
    if (key === ANCHOR) {
      ordered["工具定义"] = copy.tools;
      ordered["对话消息"] = copy.messages;
      ordered["上下文已用 {p}"] = copy.used;
    }
  }
  for (const [key, byLang] of Object.entries(IMAGE_KEYS)) {
    if (ordered[key] === undefined && byLang[lang] !== undefined) ordered[key] = byLang[lang];
  }
  fs.writeFileSync(file, `${JSON.stringify(ordered, null, 2)}\n`, "utf8");
  console.log(`${lang}: inserted`);
}

