/**
 * 过程段汇总行(网页端「执行了命令,已读取文件,修改了文件等」同款)新增词典键。
 * 中文为源键;12 语言补齐译文,枚举连接符「、」按语言替换。
 */
import fs from "node:fs";
import path from "node:path";

const root = "D:/Workspace/vscode";

const KEYS = {
  "执行了 {n} 条命令": {
    "zh-tw": "執行了 {n} 條命令", ja: "{n} 件のコマンドを実行", ko: "명령 {n}개 실행", de: "{n} Befehl(e) ausgeführt",
    fr: "{n} commande(s) exécutée(s)", es: "{n} comando(s) ejecutado(s)", pt: "{n} comando(s) executado(s)",
    th: "เรียกใช้คำสั่ง {n} ครั้ง", id: "Menjalankan {n} perintah", tr: "{n} komut çalıştırıldı",
    ru: "Выполнено команд: {n}", ar: "تم تنفيذ {n} أمر",
  },
  "读取了 {n} 个文件": {
    "zh-tw": "讀取了 {n} 個檔案", ja: "{n} 件のファイルを読み取り", ko: "파일 {n}개 읽음", de: "{n} Datei(en) gelesen",
    fr: "{n} fichier(s) lu(s)", es: "{n} archivo(s) leído(s)", pt: "{n} arquivo(s) lido(s)",
    th: "อ่านไฟล์ {n} ไฟล์", id: "Membaca {n} berkas", tr: "{n} dosya okundu",
    ru: "Прочитано файлов: {n}", ar: "تمت قراءة {n} ملف",
  },
  "修改了 {n} 个文件": {
    "zh-tw": "修改了 {n} 個檔案", ja: "{n} 件のファイルを変更", ko: "파일 {n}개 수정", de: "{n} Datei(en) geändert",
    fr: "{n} fichier(s) modifié(s)", es: "{n} archivo(s) modificado(s)", pt: "{n} arquivo(s) modificado(s)",
    th: "แก้ไขไฟล์ {n} ไฟล์", id: "Mengubah {n} berkas", tr: "{n} dosya değiştirildi",
    ru: "Изменено файлов: {n}", ar: "تم تعديل {n} ملف",
  },
  "搜索了 {n} 次": {
    "zh-tw": "搜尋了 {n} 次", ja: "{n} 回検索", ko: "검색 {n}회", de: "{n} Suche(n)",
    fr: "{n} recherche(s)", es: "{n} búsqueda(s)", pt: "{n} pesquisa(s)",
    th: "ค้นหา {n} ครั้ง", id: "Mencari {n} kali", tr: "{n} arama",
    ru: "Поисков: {n}", ar: "تم البحث {n} مرة",
  },
  "访问了 {n} 个网页": {
    "zh-tw": "存取了 {n} 個網頁", ja: "{n} 件のページを取得", ko: "웹페이지 {n}개 열람", de: "{n} Webseite(n) abgerufen",
    fr: "{n} page(s) consultée(s)", es: "{n} página(s) consultada(s)", pt: "{n} página(s) acessada(s)",
    th: "เข้าถึงเว็บ {n} หน้า", id: "Mengakses {n} halaman web", tr: "{n} web sayfası açıldı",
    ru: "Открыто страниц: {n}", ar: "تمت زيارة {n} صفحة",
  },
  "调用了 {n} 个工具": {
    "zh-tw": "呼叫了 {n} 個工具", ja: "{n} 個のツールを呼び出し", ko: "도구 {n}개 호출", de: "{n} Werkzeug(e) aufgerufen",
    fr: "{n} outil(s) appelé(s)", es: "{n} herramienta(s) invocada(s)", pt: "{n} ferramenta(s) chamada(s)",
    th: "เรียกใช้เครื่องมือ {n} ครั้ง", id: "Memanggil {n} alat", tr: "{n} araç çağrıldı",
    ru: "Вызовов инструментов: {n}", ar: "تم استدعاء {n} أداة",
  },
  "展开 / 收起这一段过程": {
    "zh-tw": "展開 / 收合這一段過程", ja: "この区間の過程を展開 / 折りたたむ", ko: "이 구간 과정 펼치기 / 접기",
    de: "Diesen Abschnitt ein-/ausklappen", fr: "Déplier / replier cette étape", es: "Expandir / contraer este tramo",
    pt: "Expandir / recolher este trecho", th: "ขยาย / ยุบช่วงขั้นตอนนี้", id: "Bentangkan / ciutkan rentetan ini",
    tr: "Bu bölümü aç / kapat", ru: "Развернуть / свернуть этот участок", ar: "توسيع / طيّ هذه المرحلة",
  },
};

for (const file of fs.readdirSync(path.join(root, "src/webview/texts"))) {
  if (!file.endsWith(".json")) continue;
  const lang = file.replace(/\.json$/, "");
  const full = path.join(root, "src/webview/texts", file);
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
  }
}
console.log("webview dictionaries updated for process-run summaries");
