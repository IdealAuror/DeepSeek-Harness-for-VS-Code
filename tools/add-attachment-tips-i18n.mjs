/**
 * 附件 / 图片提示的四条动态文案补全 12 语言词典(原先是字符串拼接,非中文界面也会显示中文)。
 * 键即中文模板,占位符 {name} / {n} / {error}。
 */
import fs from "node:fs";
import path from "node:path";

const textsDir = "D:/Workspace/vscode/src/webview/texts";

const KEYS = {
  "⚠️ 图片超过 6MB 已跳过:{name}": {
    "zh-tw": "⚠️ 圖片超過 6MB 已略過:{name}",
    ja: "⚠️ 画像が 6MB を超えるためスキップしました:{name}",
    ko: "⚠️ 이미지가 6MB를 초과하여 건너뛰었습니다: {name}",
    de: "⚠️ Bild über 6 MB übersprungen: {name}",
    fr: "⚠️ Image de plus de 6 Mo ignorée : {name}",
    es: "⚠️ Imagen de más de 6 MB omitida: {name}",
    pt: "⚠️ Imagem com mais de 6 MB ignorada: {name}",
    th: "⚠️ ข้ามรูปภาพที่เกิน 6MB: {name}",
    id: "⚠️ Gambar melebihi 6MB dilewati: {name}",
    tr: "⚠️ 6MB üzeri görsel atlandı: {name}",
    ru: "⚠️ Изображение больше 6 МБ пропущено: {name}",
    ar: "⚠️ تم تخطي صورة تتجاوز 6 ميجابايت: {name}",
  },
  "⚠️ 无法识别的图片格式:{name}(支持 PNG/JPEG/GIF/WebP)": {
    "zh-tw": "⚠️ 無法辨識的圖片格式:{name}(支援 PNG/JPEG/GIF/WebP)",
    ja: "⚠️ 判別できない画像形式です:{name}(PNG/JPEG/GIF/WebP に対応)",
    ko: "⚠️ 인식할 수 없는 이미지 형식입니다: {name}(PNG/JPEG/GIF/WebP 지원)",
    de: "⚠️ Unbekanntes Bildformat: {name} (unterstützt PNG/JPEG/GIF/WebP)",
    fr: "⚠️ Format d'image non reconnu : {name} (PNG/JPEG/GIF/WebP pris en charge)",
    es: "⚠️ Formato de imagen no reconocido: {name} (se admite PNG/JPEG/GIF/WebP)",
    pt: "⚠️ Formato de imagem não reconhecido: {name} (compatível com PNG/JPEG/GIF/WebP)",
    th: "⚠️ รูปแบบรูปภาพที่ไม่รู้จัก: {name} (รองรับ PNG/JPEG/GIF/WebP)",
    id: "⚠️ Format gambar tidak dikenali: {name} (mendukung PNG/JPEG/GIF/WebP)",
    tr: "⚠️ Tanınamayan görsel biçimi: {name} (PNG/JPEG/GIF/WebP desteklenir)",
    ru: "⚠️ Неизвестный формат изображения: {name} (поддерживаются PNG/JPEG/GIF/WebP)",
    ar: "⚠️ تنسيق صورة غير معروف: {name} (يدعم PNG/JPEG/GIF/WebP)",
  },
  "⚠️ 粘贴图片失败:{error}": {
    "zh-tw": "⚠️ 貼上圖片失敗:{error}",
    ja: "⚠️ 画像の貼り付けに失敗しました:{error}",
    ko: "⚠️ 이미지 붙여넣기 실패: {error}",
    de: "⚠️ Einfügen des Bildes fehlgeschlagen: {error}",
    fr: "⚠️ Échec du collage de l'image : {error}",
    es: "⚠️ Error al pegar la imagen: {error}",
    pt: "⚠️ Falha ao colar a imagem: {error}",
    th: "⚠️ วางรูปภาพไม่สำเร็จ: {error}",
    id: "⚠️ Gagal menempelkan gambar: {error}",
    tr: "⚠️ Görsel yapıştırılamadı: {error}",
    ru: "⚠️ Не удалось вставить изображение: {error}",
    ar: "⚠️ فشل لصق الصورة: {error}",
  },
  "✅ 已添加 {n} 张图片": {
    "zh-tw": "✅ 已加入 {n} 張圖片",
    ja: "✅ {n} 枚の画像を追加しました",
    ko: "✅ 이미지 {n}장을 추가했습니다",
    de: "✅ {n} Bild(er) hinzugefügt",
    fr: "✅ {n} image(s) ajoutée(s)",
    es: "✅ {n} imagen(es) añadida(s)",
    pt: "✅ {n} imagem(ns) adicionada(s)",
    th: "✅ เพิ่มรูปภาพ {n} รูปแล้ว",
    id: "✅ {n} gambar ditambahkan",
    tr: "✅ {n} görsel eklendi",
    ru: "✅ Добавлено изображений: {n}",
    ar: "✅ تمت إضافة {n} صورة",
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
