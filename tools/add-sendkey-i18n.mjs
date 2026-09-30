/**
 * 0.13.21:发送快捷键在设置面板 + 输入框内可切换所需的新文案。
 * Webview 键(中文为源)+ 宿主 l10n 键(设置说明),14 种语言全量补齐。
 * 只追加缺失键,不重排既有内容。
 */
import fs from "node:fs";
import path from "node:path";

const root = "D:/Workspace/vscode";

/** 键 → 各语言译文(zh-cn 为源语言,不入 webview 词典)。 */
const WEBVIEW_KEYS = {
  "⌨️ 发送与输入": {
    "zh-tw": "⌨️ 傳送與輸入", ja: "⌨️ 送信と入力", ko: "⌨️ 전송 및 입력", de: "⌨️ Senden und Eingabe",
    fr: "⌨️ Envoi et saisie", es: "⌨️ Envío y entrada", pt: "⌨️ Envio e entrada", th: "⌨️ การส่งและอินพุต",
    id: "⌨️ Kirim dan input", tr: "⌨️ Gönderme ve giriş", ru: "⌨️ Отправка и ввод", ar: "⌨️ الإرسال والإدخال",
  },
  "Enter 发送": {
    "zh-tw": "Enter 傳送", ja: "Enter で送信", ko: "Enter 전송", de: "Enter sendet",
    fr: "Entrée envoie", es: "Enter envía", pt: "Enter envia", th: "Enter เพื่อส่ง",
    id: "Enter mengirim", tr: "Enter gönderir", ru: "Enter отправляет", ar: "Enter للإرسال",
  },
  "Ctrl+Enter 发送": {
    "zh-tw": "Ctrl+Enter 傳送", ja: "Ctrl+Enter で送信", ko: "Ctrl+Enter 전송", de: "Ctrl+Enter sendet",
    fr: "Ctrl+Entrée envoie", es: "Ctrl+Enter envía", pt: "Ctrl+Enter envia", th: "Ctrl+Enter เพื่อส่ง",
    id: "Ctrl+Enter mengirim", tr: "Ctrl+Enter gönderir", ru: "Ctrl+Enter отправляет", ar: "Ctrl+Enter للإرسال",
  },
  "Shift+Enter 发送": {
    "zh-tw": "Shift+Enter 傳送", ja: "Shift+Enter で送信", ko: "Shift+Enter 전송", de: "Shift+Enter sendet",
    fr: "Maj+Entrée envoie", es: "Mayús+Enter envía", pt: "Shift+Enter envia", th: "Shift+Enter เพื่อส่ง",
    id: "Shift+Enter mengirim", tr: "Shift+Enter gönderir", ru: "Shift+Enter отправляет", ar: "Shift+Enter للإرسال",
  },
  "Enter 发送,Shift+Enter 换行": {
    "zh-tw": "Enter 傳送,Shift+Enter 換行", ja: "Enter で送信、Shift+Enter で改行", ko: "Enter 전송, Shift+Enter 줄바꿈",
    de: "Enter sendet, Shift+Enter fügt eine neue Zeile ein", fr: "Entrée envoie, Maj+Entrée insère un saut de ligne",
    es: "Enter envía, Mayús+Enter inserta un salto de línea", pt: "Enter envia, Shift+Enter insere uma nova linha",
    th: "Enter เพื่อส่ง, Shift+Enter เพื่อขึ้นบรรทัดใหม่", id: "Enter mengirim, Shift+Enter baris baru",
    tr: "Enter gönderir, Shift+Enter yeni satır", ru: "Enter отправляет, Shift+Enter переносит строку",
    ar: "Enter للإرسال، وShift+Enter لسطر جديد",
  },
  "Ctrl+Enter 发送,Enter 换行(习惯用 Enter 换行时选它)": {
    "zh-tw": "Ctrl+Enter 傳送,Enter 換行(習慣用 Enter 換行時選它)",
    ja: "Ctrl+Enter で送信、Enter で改行(Enter で改行したい場合に)",
    ko: "Ctrl+Enter 전송, Enter 줄바꿈(Enter로 줄바꿈하는 습관에 적합)",
    de: "Ctrl+Enter sendet, Enter fügt eine neue Zeile ein (für alle, die mit Enter umbrechen)",
    fr: "Ctrl+Entrée envoie, Entrée insère un saut de ligne (si vous préférez Entrée pour aller à la ligne)",
    es: "Ctrl+Enter envía, Enter inserta un salto de línea (si prefieres Enter para saltar de línea)",
    pt: "Ctrl+Enter envia, Enter insere nova linha (para quem usa Enter para quebrar linha)",
    th: "Ctrl+Enter เพื่อส่ง, Enter เพื่อขึ้นบรรทัดใหม่ (เหมาะกับคนที่ใช้ Enter ขึ้นบรรทัด)",
    id: "Ctrl+Enter mengirim, Enter baris baru (bila terbiasa Enter untuk baris baru)",
    tr: "Ctrl+Enter gönderir, Enter yeni satır (Enter ile satır atlamaya alışkınsanız)",
    ru: "Ctrl+Enter отправляет, Enter переносит строку (если привыкли к Enter)",
    ar: "Ctrl+Enter للإرسال وEnter لسطر جديد (لمن اعتاد Enter لسطر جديد)",
  },
  "Shift+Enter 发送,Enter 换行": {
    "zh-tw": "Shift+Enter 傳送,Enter 換行", ja: "Shift+Enter で送信、Enter で改行", ko: "Shift+Enter 전송, Enter 줄바꿈",
    de: "Shift+Enter sendet, Enter fügt eine neue Zeile ein", fr: "Maj+Entrée envoie, Entrée insère un saut de ligne",
    es: "Mayús+Enter envía, Enter inserta un salto de línea", pt: "Shift+Enter envia, Enter insere nova linha",
    th: "Shift+Enter เพื่อส่ง, Enter เพื่อขึ้นบรรทัดใหม่", id: "Shift+Enter mengirim, Enter baris baru",
    tr: "Shift+Enter gönderir, Enter yeni satır", ru: "Shift+Enter отправляет, Enter переносит строку",
    ar: "Shift+Enter للإرسال وEnter لسطر جديد",
  },
  "发送快捷键": {
    "zh-tw": "傳送快速鍵", ja: "送信ショートカット", ko: "전송 단축키", de: "Sende-Tastenkürzel",
    fr: "Raccourci d'envoi", es: "Atajo de envío", pt: "Atalho de envio", th: "คีย์ลัดการส่ง",
    id: "Pintasan kirim", tr: "Gönderme kısayolu", ru: "Горячая клавиша отправки", ar: "اختصار الإرسال",
  },
  "发送快捷键:{current}": {
    "zh-tw": "傳送快速鍵:{current}", ja: "送信ショートカット: {current}", ko: "전송 단축키: {current}",
    de: "Sende-Tastenkürzel: {current}", fr: "Raccourci d'envoi : {current}", es: "Atajo de envío: {current}",
    pt: "Atalho de envio: {current}", th: "คีย์ลัดการส่ง: {current}", id: "Pintasan kirim: {current}",
    tr: "Gönderme kısayolu: {current}", ru: "Горячая клавиша отправки: {current}", ar: "اختصار الإرسال: {current}",
  },
  "当前:{current}。点击切换为「{next}」。也可在设置面板中修改。": {
    "zh-tw": "目前:{current}。點擊切換為「{next}」。也可在設定面板中修改。",
    ja: "現在: {current}。クリックで「{next}」に切り替え。設定パネルでも変更できます。",
    ko: "현재: {current}. 클릭하면 「{next}」(으)로 전환됩니다. 설정 패널에서도 변경할 수 있습니다.",
    de: "Aktuell: {current}. Klicken wechselt zu „{next}“. Auch im Einstellungsbereich änderbar.",
    fr: "Actuel : {current}. Cliquez pour passer à « {next} ». Modifiable aussi dans les réglages.",
    es: "Actual: {current}. Haz clic para cambiar a «{next}». También se puede cambiar en Ajustes.",
    pt: "Atual: {current}. Clique para mudar para «{next}». Também pode ser alterado nas configurações.",
    th: "ปัจจุบัน: {current} คลิกเพื่อสลับเป็น «{next}» แก้ไขได้ในแผงตั้งค่าด้วย",
    id: "Saat ini: {current}. Klik untuk beralih ke «{next}». Bisa juga diubah di panel pengaturan.",
    tr: "Geçerli: {current}. «{next}» için tıklayın. Ayarlar panelinden de değiştirilebilir.",
    ru: "Сейчас: {current}. Нажмите, чтобы переключить на «{next}». Можно изменить и в настройках.",
    ar: "الحالي: {current}. انقر للتبديل إلى «{next}». يمكن تغييره أيضًا من لوحة الإعدادات.",
  },
  "在设置中修改": {
    "zh-tw": "在設定中修改", ja: "設定で変更", ko: "설정에서 변경", de: "In den Einstellungen ändern",
    fr: "Modifier dans les réglages", es: "Cambiar en Ajustes", pt: "Alterar nas configurações", th: "แก้ไขในการตั้งค่า",
    id: "Ubah di pengaturan", tr: "Ayarlarda değiştir", ru: "Изменить в настройках", ar: "التغيير في الإعدادات",
  },
  "按 Enter 是发送还是换行由此决定;输入框左下角的胶囊与头部 ⌨️ 按钮也能一键切换,设置会全局保存(dsh.sendKey)。": {
    "zh-tw": "按 Enter 是傳送還是換行由此決定;輸入框左下角的膠囊與頂部 ⌨️ 按鈕也能一鍵切換,設定會全域儲存(dsh.sendKey)。",
    ja: "Enter が送信か改行かをここで決めます。入力欄左下のチップと上部の ⌨️ ボタンからも切り替えでき、設定は全体的に保存されます(dsh.sendKey)。",
    ko: "Enter가 전송인지 줄바꿈인지 여기서 결정합니다. 입력창 왼쪽 아래 칩과 상단 ⌨️ 버튼으로도 전환할 수 있고 설정은 전역으로 저장됩니다(dsh.sendKey).",
    de: "Hier entscheidet sich, ob Enter sendet oder umbricht; auch der Chip unten links im Eingabefeld und die ⌨️-Taste oben schalten um. Die Einstellung wird global gespeichert (dsh.sendKey).",
    fr: "C'est ici que l'on choisit si Entrée envoie ou passe à la ligne ; la pastille en bas à gauche du champ et le bouton ⌨️ en haut permettent aussi de basculer. Le réglage est enregistré globalement (dsh.sendKey).",
    es: "Aquí se decide si Enter envía o salta de línea; la píldora de la esquina inferior izquierda del cuadro y el botón ⌨️ de arriba también permiten cambiarlo. El ajuste se guarda globalmente (dsh.sendKey).",
    pt: "Aqui se decide se Enter envia ou quebra linha; a pílula no canto inferior esquerdo do campo e o botão ⌨️ no topo também alternam. A configuração é salva globalmente (dsh.sendKey).",
    th: "ที่นี่กำหนดว่า Enter จะส่งหรือขึ้นบรรทัดใหม่ ชิปมุมล่างซ้ายของช่องพิมพ์และปุ่ม ⌨️ ด้านบนก็สลับได้เช่นกัน และบันทึกเป็นการตั้งค่าทั่วไป (dsh.sendKey)",
    id: "Di sini ditentukan apakah Enter mengirim atau membuat baris baru; chip di kiri bawah kotak masukan dan tombol ⌨️ di atas juga bisa menggantinya. Pengaturan disimpan global (dsh.sendKey).",
    tr: "Enter'ın gönderip göndermeyeceği burada belirlenir; giriş kutusunun sol alt köşesindeki çip ve üstteki ⌨️ düğmesi de değiştirir. Ayar genel olarak kaydedilir (dsh.sendKey).",
    ru: "Здесь решается, отправляет Enter сообщение или переносит строку; переключить можно также чипом в левом нижнем углу поля ввода и кнопкой ⌨️ сверху. Настройка сохраняется глобально (dsh.sendKey).",
    ar: "هنا يُحدَّد ما إذا كان Enter يُرسل أو ينقل إلى سطر جديد؛ ويمكن التبديل أيضًا من الشريحة أسفل يسار حقل الإدخال ومن زر ⌨️ في الأعلى. يُحفظ الإعداد عامًّا (dsh.sendKey).",
  },
  "输入区字体(留空跟随 VS Code 界面字体)": {
    "zh-tw": "輸入區字型(留空跟隨 VS Code 介面字型)", ja: "入力欄のフォント(空欄で VS Code の UI フォントに従う)",
    ko: "입력창 글꼴(비우면 VS Code UI 글꼴 사용)", de: "Schriftart des Eingabefelds (leer = VS Code-Oberflächenschrift)",
    fr: "Police de la zone de saisie (vide = police de l'interface VS Code)", es: "Fuente del cuadro de entrada (vacío = fuente de la interfaz de VS Code)",
    pt: "Fonte do campo de entrada (vazio = fonte da interface do VS Code)", th: "ฟอนต์ช่องพิมพ์ (เว้นว่างเพื่อใช้ฟอนต์ UI ของ VS Code)",
    id: "Font kotak masukan (kosong = font antarmuka VS Code)", tr: "Giriş alanı yazı tipi (boş = VS Code arayüz yazı tipi)",
    ru: "Шрифт поля ввода (пусто — шрифт интерфейса VS Code)", ar: "خط حقل الإدخال (اتركه فارغًا لخط واجهة VS Code)",
  },
  "产物文件列表默认折叠": {
    "zh-tw": "產物檔案清單預設折疊", ja: "成果ファイル一覧を既定で折りたたむ", ko: "산출물 파일 목록 기본 접기",
    de: "Ergebnisdateiliste standardmäßig einklappen", fr: "Replier la liste des fichiers produits par défaut",
    es: "Contraer la lista de archivos generados por defecto", pt: "Recolher a lista de arquivos gerados por padrão",
    th: "ยุบรายการไฟล์ผลลัพธ์เป็นค่าเริ่มต้น", id: "Ciutkan daftar berkas hasil secara bawaan",
    tr: "Üretilen dosya listesini varsayılan olarak daralt", ru: "Сворачивать список созданных файлов по умолчанию",
    ar: "طيّ قائمة الملفات الناتجة افتراضيًا",
  },
  "默认把每轮的产物文件折叠为一行摘要,避免长对话被文件卡占满": {
    "zh-tw": "預設把每輪的產物檔案折疊為一行摘要,避免長對話被檔案卡佔滿",
    ja: "各ターンの成果ファイルを既定で1行に折りたたみ、長い会話がカードで埋まるのを防ぎます",
    ko: "각 턴의 산출물 파일을 기본적으로 한 줄로 접어 긴 대화가 카드로 가득 차는 것을 막습니다",
    de: "Fasst die Ergebnisdateien jeder Runde standardmäßig zu einer Zeile zusammen, damit lange Unterhaltungen nicht von Karten gefüllt werden",
    fr: "Replie par défaut les fichiers produits de chaque tour sur une ligne, pour éviter que les longues conversations soient saturées de cartes",
    es: "Contrae por defecto los archivos generados de cada turno en una línea, para que las conversaciones largas no se llenen de tarjetas",
    pt: "Recolhe por padrão os arquivos gerados de cada turno em uma linha, para que conversas longas não fiquem cheias de cartões",
    th: "ยุบไฟล์ผลลัพธ์ของแต่ละเทิร์นเป็นหนึ่งบรรทัดโดยค่าเริ่มต้น เพื่อไม่ให้บทสนทนายาวเต็มไปด้วยการ์ด",
    id: "Meringkas berkas hasil tiap turn menjadi satu baris secara bawaan agar percakapan panjang tidak penuh kartu",
    tr: "Her turun üretilen dosyalarını varsayılan olarak tek satıra indirir; böylece uzun sohbetler kartlarla dolmaz",
    ru: "По умолчанию сворачивает созданные за ход файлы в одну строку, чтобы длинные диалоги не заполнялись карточками",
    ar: "يطوي ملفات كل دور في سطر واحد افتراضيًا حتى لا تمتلئ المحادثات الطويلة بالبطاقات",
  },
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
console.log(`webview dictionaries updated: ${webviewAdded}`);
