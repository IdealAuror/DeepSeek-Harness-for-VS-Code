/**
 * issue #21 采纳项新增的配置项文案(package.nls.* 共 15 个语言包)。
 * 中文为源键基准:zh-cn 给中文,en 给英文,其余给对应译文。
 */
import fs from "node:fs";
import path from "node:path";

const root = "D:/Workspace/vscode";

const KEYS = {
  "config.sendKey": {
    "zh-cn": "发送消息的快捷键。默认 Enter 发送、Shift+Enter 换行;习惯用 Enter 换行时可改为 Ctrl+Enter 或 Shift+Enter 发送。",
    en: "Keyboard shortcut that sends a message. By default Enter sends and Shift+Enter inserts a newline; if you prefer Enter to insert newlines, switch to Ctrl+Enter or Shift+Enter.",
    "zh-tw": "傳送訊息的快速鍵。預設 Enter 傳送、Shift+Enter 換行;習慣用 Enter 換行時可改為 Ctrl+Enter 或 Shift+Enter 傳送。",
    ja: "メッセージ送信のショートカット。既定では Enter で送信、Shift+Enter で改行します。Enter で改行したい場合は Ctrl+Enter または Shift+Enter 送信に変更してください。",
    ko: "메시지 전송 단축키입니다. 기본값은 Enter 전송, Shift+Enter 줄바꿈이며, Enter로 줄바꿈하려면 Ctrl+Enter 또는 Shift+Enter 전송으로 변경하세요.",
    de: "Tastenkürzel zum Senden einer Nachricht. Standard: Enter sendet, Shift+Enter fügt einen Zeilenumbruch ein; wenn Enter umbrechen soll, auf Ctrl+Enter oder Shift+Enter umstellen.",
    fr: "Raccourci d'envoi d'un message. Par défaut Entrée envoie et Maj+Entrée insère un saut de ligne ; si vous préférez qu'Entrée insère un saut de ligne, choisissez Ctrl+Entrée ou Maj+Entrée.",
    es: "Atajo para enviar un mensaje. Por defecto Enter envía y Mayús+Enter inserta un salto de línea; si prefieres que Enter salte de línea, usa Ctrl+Enter o Mayús+Enter.",
    pt: "Atalho para enviar uma mensagem. Por padrão Enter envia e Shift+Enter quebra a linha; se preferir que Enter quebre a linha, use Ctrl+Enter ou Shift+Enter.",
    th: "ปุ่มลัดสำหรับส่งข้อความ ค่าเริ่มต้นคือ Enter ส่ง และ Shift+Enter ขึ้นบรรทัดใหม่ หากต้องการให้ Enter ขึ้นบรรทัดใหม่ ให้เปลี่ยนเป็น Ctrl+Enter หรือ Shift+Enter",
    id: "Pintasan untuk mengirim pesan. Bawaan: Enter mengirim dan Shift+Enter membuat baris baru; jika ingin Enter membuat baris baru, pilih Ctrl+Enter atau Shift+Enter.",
    tr: "Mesaj gönderme kısayolu. Varsayılan olarak Enter gönderir, Shift+Enter satır atlar; Enter'ın satır atlamasını istiyorsanız Ctrl+Enter veya Shift+Enter seçin.",
    ru: "Сочетание клавиш для отправки сообщения. По умолчанию Enter отправляет, Shift+Enter переносит строку; если хотите, чтобы Enter переносил строку, выберите Ctrl+Enter или Shift+Enter.",
    ar: "اختصار إرسال الرسالة. افتراضيًا يُرسل Enter ويُدرج Shift+Enter سطرًا جديدًا؛ إذا فضّلت أن يُدرج Enter سطرًا جديدًا فاختر Ctrl+Enter أو Shift+Enter.",
  },
  "config.sendKey.enter": {
    "zh-cn": "Enter 发送,Shift+Enter 换行(默认)",
    en: "Enter sends, Shift+Enter inserts a newline (default)",
    "zh-tw": "Enter 傳送,Shift+Enter 換行(預設)",
    ja: "Enter で送信、Shift+Enter で改行(既定)",
    ko: "Enter 전송, Shift+Enter 줄바꿈(기본)",
    de: "Enter sendet, Shift+Enter bricht um (Standard)",
    fr: "Entrée envoie, Maj+Entrée saute une ligne (par défaut)",
    es: "Enter envía, Mayús+Enter salta de línea (predeterminado)",
    pt: "Enter envia, Shift+Enter quebra a linha (padrão)",
    th: "Enter ส่ง, Shift+Enter ขึ้นบรรทัดใหม่ (ค่าเริ่มต้น)",
    id: "Enter mengirim, Shift+Enter baris baru (bawaan)",
    tr: "Enter gönderir, Shift+Enter satır atlar (varsayılan)",
    ru: "Enter отправляет, Shift+Enter переносит строку (по умолчанию)",
    ar: "Enter يُرسل و Shift+Enter سطر جديد (افتراضي)",
  },
  "config.sendKey.ctrlEnter": {
    "zh-cn": "Ctrl+Enter 发送(Enter 换行)",
    en: "Ctrl+Enter sends (Enter inserts a newline)",
    "zh-tw": "Ctrl+Enter 傳送(Enter 換行)",
    ja: "Ctrl+Enter で送信(Enter は改行)",
    ko: "Ctrl+Enter 전송(Enter는 줄바꿈)",
    de: "Ctrl+Enter sendet (Enter bricht um)",
    fr: "Ctrl+Entrée envoie (Entrée saute une ligne)",
    es: "Ctrl+Enter envía (Enter salta de línea)",
    pt: "Ctrl+Enter envia (Enter quebra a linha)",
    th: "Ctrl+Enter ส่ง (Enter ขึ้นบรรทัดใหม่)",
    id: "Ctrl+Enter mengirim (Enter baris baru)",
    tr: "Ctrl+Enter gönderir (Enter satır atlar)",
    ru: "Ctrl+Enter отправляет (Enter переносит строку)",
    ar: "Ctrl+Enter يُرسل (Enter سطر جديد)",
  },
  "config.sendKey.shiftEnter": {
    "zh-cn": "Shift+Enter 发送(Enter 换行)",
    en: "Shift+Enter sends (Enter inserts a newline)",
    "zh-tw": "Shift+Enter 傳送(Enter 換行)",
    ja: "Shift+Enter で送信(Enter は改行)",
    ko: "Shift+Enter 전송(Enter는 줄바꿈)",
    de: "Shift+Enter sendet (Enter bricht um)",
    fr: "Maj+Entrée envoie (Entrée saute une ligne)",
    es: "Mayús+Enter envía (Enter salta de línea)",
    pt: "Shift+Enter envia (Enter quebra a linha)",
    th: "Shift+Enter ส่ง (Enter ขึ้นบรรทัดใหม่)",
    id: "Shift+Enter mengirim (Enter baris baru)",
    tr: "Shift+Enter gönderir (Enter satır atlar)",
    ru: "Shift+Enter отправляет (Enter переносит строку)",
    ar: "Shift+Enter يُرسل (Enter سطر جديد)",
  },
  "config.uiFontFamily": {
    "zh-cn": "聊天面板的字体族(CSS font-family)。留空跟随 VS Code 界面字体;Windows 中文用户可填 \"Microsoft YaHei UI\", \"Microsoft YaHei\", sans-serif 以获得更好的中文字形。",
    en: "Font family (CSS font-family) for the chat panel. Leave empty to follow the VS Code UI font. On Windows, \"Microsoft YaHei UI\", \"Microsoft YaHei\", sans-serif gives better Chinese glyphs.",
    "zh-tw": "聊天面板的字型(CSS font-family)。留空跟隨 VS Code 介面字型;Windows 使用者可填 \"Microsoft JhengHei UI\", \"Microsoft JhengHei\", sans-serif。",
    ja: "チャットパネルのフォント(CSS font-family)。空欄なら VS Code の UI フォントに従います。日本語なら \"Yu Gothic UI\", \"Meiryo\", sans-serif など。",
    ko: "채팅 패널 글꼴(CSS font-family). 비워 두면 VS Code UI 글꼴을 따릅니다. 한국어는 \"Malgun Gothic\", sans-serif 를 권장합니다.",
    de: "Schriftfamilie (CSS font-family) für das Chat-Panel. Leer lassen, um der VS-Code-UI-Schrift zu folgen.",
    fr: "Police (CSS font-family) du panneau de discussion. Laisser vide pour suivre la police de l'interface VS Code.",
    es: "Familia tipográfica (CSS font-family) del panel de chat. Déjalo vacío para usar la fuente de la interfaz de VS Code.",
    pt: "Fonte (CSS font-family) do painel de chat. Deixe vazio para seguir a fonte da interface do VS Code.",
    th: "ฟอนต์ (CSS font-family) ของแผงแชท เว้นว่างเพื่อใช้ฟอนต์ UI ของ VS Code",
    id: "Keluarga font (CSS font-family) panel obrolan. Kosongkan untuk mengikuti font UI VS Code.",
    tr: "Sohbet paneli için yazı tipi (CSS font-family). Boş bırakılırsa VS Code arayüz yazı tipi kullanılır.",
    ru: "Семейство шрифтов (CSS font-family) панели чата. Оставьте пустым, чтобы использовать шрифт интерфейса VS Code.",
    ar: "عائلة الخطوط (CSS font-family) للوحة الدردشة. اتركه فارغًا لاستخدام خط واجهة VS Code.",
  },
  "config.newSessionOnStartup": {
    "zh-cn": "打开聊天面板时自动新建一个空会话(无需手动点「＋」);已有上次会话时优先恢复。",
    en: "Automatically create an empty session when the chat panel opens (no need to click +); a remembered session is restored instead when available.",
    "zh-tw": "開啟聊天面板時自動建立一個空工作階段(無需手動點「＋」);若有上次的工作階段則優先恢復。",
    ja: "チャットパネルを開いたときに空のセッションを自動作成します(「＋」を押す必要なし)。前回のセッションがあればそちらを復元します。",
    ko: "채팅 패널을 열 때 빈 세션을 자동으로 만듭니다(＋를 누를 필요 없음). 기억된 세션이 있으면 그것을 복원합니다.",
    de: "Beim Öffnen des Chat-Panels automatisch eine leere Sitzung anlegen (kein Klick auf + nötig); eine gemerkte Sitzung wird stattdessen wiederhergestellt.",
    fr: "Créer automatiquement une session vide à l'ouverture du panneau (sans cliquer sur +) ; une session mémorisée est restaurée à la place.",
    es: "Crea automáticamente una sesión vacía al abrir el panel (sin pulsar +); se restaura la sesión recordada si existe.",
    pt: "Cria automaticamente uma sessão vazia ao abrir o painel (sem clicar em +); uma sessão lembrada é restaurada em vez disso.",
    th: "สร้างเซสชันว่างอัตโนมัติเมื่อเปิดแผงแชท (ไม่ต้องกด +) และจะกู้เซสชันที่จำไว้ก่อน",
    id: "Buat sesi kosong otomatis saat panel obrolan dibuka (tanpa menekan +); sesi yang diingat akan dipulihkan.",
    tr: "Sohbet paneli açıldığında boş bir oturum oluşturur (+ tuşuna gerek yok); hatırlanan oturum varsa o geri yüklenir.",
    ru: "Автоматически создавать пустую сессию при открытии панели чата (без нажатия «+»); запомненная сессия восстанавливается вместо неё.",
    ar: "إنشاء جلسة فارغة تلقائيًا عند فتح لوحة الدردشة (دون الضغط على +)، وتُستعاد الجلسة المحفوظة إن وُجدت.",
  },
  "config.rememberLastSession": {
    "zh-cn": "记住每个工作区最后使用的会话,重新打开 VS Code 时自动恢复。",
    en: "Remember the last session used in each workspace and restore it when VS Code reopens.",
    "zh-tw": "記住每個工作區最後使用的工作階段,重新開啟 VS Code 時自動恢復。",
    ja: "ワークスペースごとに最後に使ったセッションを記憶し、VS Code の再起動時に復元します。",
    ko: "작업 영역별로 마지막으로 사용한 세션을 기억하고 VS Code 재시작 시 복원합니다.",
    de: "Die zuletzt in jedem Arbeitsbereich verwendete Sitzung merken und beim Neustart von VS Code wiederherstellen.",
    fr: "Mémoriser la dernière session utilisée par espace de travail et la restaurer au redémarrage de VS Code.",
    es: "Recuerda la última sesión usada en cada espacio de trabajo y la restaura al reabrir VS Code.",
    pt: "Lembra a última sessão usada em cada espaço de trabalho e a restaura ao reabrir o VS Code.",
    th: "จดจำเซสชันล่าสุดของแต่ละเวิร์กสเปซและกู้คืนเมื่อเปิด VS Code ใหม่",
    id: "Ingat sesi terakhir per workspace dan pulihkan saat VS Code dibuka kembali.",
    tr: "Her çalışma alanında son kullanılan oturumu hatırla ve VS Code yeniden açıldığında geri yükle.",
    ru: "Запоминать последнюю сессию каждого рабочего пространства и восстанавливать её при запуске VS Code.",
    ar: "تذكّر آخر جلسة في كل مساحة عمل واستعدها عند إعادة فتح VS Code.",
  },
  "config.autoCollapseProducedFiles": {
    "zh-cn": "产物文件列表默认折叠为一行摘要(点击展开),避免多轮对话后被大量产物卡片占满。",
    en: "Collapse the produced-files list into a one-line summary by default (click to expand), so long conversations are not filled with deliverable cards.",
    "zh-tw": "產物檔案清單預設折疊為一行摘要(點擊展開),避免多輪對話被大量產物卡片佔滿。",
    ja: "成果物ファイル一覧を既定で 1 行の要約に折りたたみます(クリックで展開)。長い会話が成果物カードで埋まるのを防ぎます。",
    ko: "산출물 파일 목록을 기본적으로 한 줄 요약으로 접습니다(클릭하여 펼침). 긴 대화가 산출물 카드로 가득 차는 것을 막습니다.",
    de: "Die Liste erzeugter Dateien standardmäßig zu einer Zeile zusammenklappen (zum Aufklappen klicken), damit lange Chats nicht mit Dateikarten gefüllt werden.",
    fr: "Réduire la liste des fichiers produits à un résumé d'une ligne (cliquer pour développer), pour éviter que les longues discussions soient remplies de cartes.",
    es: "Contrae la lista de archivos producidos a un resumen de una línea (clic para expandir), para que las conversaciones largas no se llenen de tarjetas.",
    pt: "Recolhe a lista de arquivos produzidos em um resumo de uma linha (clique para expandir), para não encher conversas longas de cartões.",
    th: "ย่อรายการไฟล์ผลลัพธ์เป็นสรุปหนึ่งบรรทัด (คลิกเพื่อขยาย) เพื่อไม่ให้บทสนทนายาวเต็มไปด้วยการ์ดไฟล์",
    id: "Ringkas daftar berkas hasil menjadi satu baris (klik untuk membuka) agar percakapan panjang tidak penuh kartu berkas.",
    tr: "Üretilen dosya listesini varsayılan olarak tek satır özete indir (genişletmek için tıkla); uzun sohbetler dosya kartlarıyla dolmasın.",
    ru: "Сворачивать список созданных файлов в одну строку (разворачивается по клику), чтобы длинные диалоги не заполнялись карточками.",
    ar: "طيّ قائمة الملفات الناتجة إلى سطر واحد افتراضيًا (انقر للتوسيع) حتى لا تمتلئ المحادثات الطويلة ببطاقات الملفات.",
  },
};

let updated = 0;
for (const file of fs.readdirSync(root)) {
  if (!/^package\.nls(\..*)?\.json$/.test(file)) continue;
  const lang = file === "package.nls.json" ? "en" : file.replace(/^package\.nls\./, "").replace(/\.json$/, "");
  const full = path.join(root, file);
  const dict = JSON.parse(fs.readFileSync(full, "utf8"));
  let changed = false;
  for (const [key, byLang] of Object.entries(KEYS)) {
    const value = byLang[lang];
    if (dict[key] === undefined && value !== undefined) {
      dict[key] = value;
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(full, `${JSON.stringify(dict, null, 2)}\n`, "utf8");
    updated++;
  }
}
console.log(`package.nls files updated: ${updated}`);
