/** 工具行标题(网页端 tool.title.* 同源)补齐 12 语言词典 + EN_TEXT 由手工同步。 */
import fs from "node:fs";
import path from "node:path";

const textsDir = "D:/Workspace/vscode/src/webview/texts";

const KEYS = {
  "读取": {
    "zh-tw": "讀取", ja: "読み取り", ko: "읽기", de: "Lesen",
    fr: "Lecture", es: "Lectura", pt: "Leitura", th: "อ่าน",
    id: "Baca", tr: "Okuma", ru: "Чтение", ar: "قراءة",
  },
  "写入": {
    "zh-tw": "寫入", ja: "書き込み", ko: "쓰기", de: "Schreiben",
    fr: "Écriture", es: "Escritura", pt: "Gravação", th: "เขียน",
    id: "Tulis", tr: "Yazma", ru: "Запись", ar: "كتابة",
  },
  "搜索": {
    "zh-tw": "搜尋", ja: "検索", ko: "검색", de: "Suchen",
    fr: "Recherche", es: "Búsqueda", pt: "Busca", th: "ค้นหา",
    id: "Cari", tr: "Arama", ru: "Поиск", ar: "بحث",
  },
  "工具调用": {
    "zh-tw": "工具呼叫", ja: "ツール呼び出し", ko: "도구 호출", de: "Werkzeugaufruf",
    fr: "Appel d'outil", es: "Llamada a herramienta", pt: "Chamada de ferramenta", th: "การเรียกเครื่องมือ",
    id: "Panggilan alat", tr: "Araç çağrısı", ru: "Вызов инструмента", ar: "استدعاء أداة",
  },
  "技能": {
    "zh-tw": "技能", ja: "スキル", ko: "스킬", de: "Skill",
    fr: "Compétence", es: "Habilidad", pt: "Habilidade", th: "สกิล",
    id: "Keterampilan", tr: "Yetenek", ru: "Навык", ar: "مهارة",
  },
  "网页搜索": {
    "zh-tw": "網頁搜尋", ja: "ウェブ検索", ko: "웹 검색", de: "Websuche",
    fr: "Recherche web", es: "Búsqueda web", pt: "Pesquisa na web", th: "ค้นหาเว็บ",
    id: "Pencarian web", tr: "Web araması", ru: "Веб-поиск", ar: "بحث الويب",
  },
  "网页获取": {
    "zh-tw": "網頁取得", ja: "ウェブ取得", ko: "웹 가져오기", de: "Webabruf",
    fr: "Récupération web", es: "Obtención web", pt: "Obtenção web", th: "ดึงเว็บ",
    id: "Ambil web", tr: "Web getirme", ru: "Загрузка страницы", ar: "جلب الويب",
  },
  "读取图片": {
    "zh-tw": "讀取圖片", ja: "画像の読み取り", ko: "이미지 읽기", de: "Bild lesen",
    fr: "Lecture d'image", es: "Lectura de imagen", pt: "Leitura de imagem", th: "อ่านรูปภาพ",
    id: "Baca gambar", tr: "Görsel okuma", ru: "Чтение изображения", ar: "قراءة صورة",
  },
  "失败": {
    "zh-tw": "失敗", ja: "失敗", ko: "실패", de: "Fehlgeschlagen",
    fr: "Échec", es: "Error", pt: "Falha", th: "ล้มเหลว",
    id: "Gagal", tr: "Başarısız", ru: "Ошибка", ar: "فشل",
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
