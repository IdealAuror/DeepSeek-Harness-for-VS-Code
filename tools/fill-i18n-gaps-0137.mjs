/**
 * 补齐两处本地化缺口:
 * 1) 网页端词典(src/webview/texts/*.json)缺 9 条权限/预设相关文案;
 * 2) 宿主 l10n 包(l10n/bundle.l10n.*.json)缺 notice.permissionBusy 与 hub.modelNoImages。
 * 仅追加缺失键,不重排既有内容。
 */
import fs from "node:fs";
import path from "node:path";

const root = "D:/Workspace/vscode";

/** 键 → 各语言译文(zh-cn 为源语言,不入词典)。 */
const WEBVIEW_KEYS = {
  "模型与思考(推理强度)": {
    "zh-tw": "模型與思考(推理強度)",
    ja: "モデルと思考(推論強度)",
    ko: "모델 및 사고(추론 강도)",
    de: "Modell und Denken (Reasoning-Aufwand)",
    fr: "Modèle et réflexion (effort de raisonnement)",
    es: "Modelo y pensamiento (esfuerzo de razonamiento)",
    pt: "Modelo e raciocínio (esforço de raciocínio)",
    th: "โมเดลและการคิด (ระดับการให้เหตุผล)",
    id: "Model dan pemikiran (tingkat penalaran)",
    tr: "Model ve düşünme (akıl yürütme düzeyi)",
    ru: "Модель и размышление (уровень рассуждений)",
    ar: "الطراز والتفكير (مستوى الاستدلال)",
  },
  "应如何批准操作?": {
    "zh-tw": "應如何批准操作?",
    ja: "操作をどのように承認しますか?",
    ko: "작업을 어떻게 승인할까요?",
    de: "Wie sollen Aktionen genehmigt werden?",
    fr: "Comment les opérations doivent-elles être approuvées ?",
    es: "¿Cómo se deben aprobar las operaciones?",
    pt: "Como as operações devem ser aprovadas?",
    th: "จะอนุมัติการดำเนินการอย่างไร?",
    id: "Bagaimana operasi harus disetujui?",
    tr: "İşlemler nasıl onaylanmalı?",
    ru: "Как утверждать операции?",
    ar: "كيف تتم الموافقة على العمليات؟",
  },
  "了解更多": {
    "zh-tw": "瞭解更多",
    ja: "詳細を見る",
    ko: "자세히 알아보기",
    de: "Mehr erfahren",
    fr: "En savoir plus",
    es: "Más información",
    pt: "Saiba mais",
    th: "เรียนรู้เพิ่มเติม",
    id: "Pelajari lebih lanjut",
    tr: "Daha fazla bilgi",
    ru: "Подробнее",
    ar: "معرفة المزيد",
  },
  "会话已开始,预设不可切换(新会话可选)": {
    "zh-tw": "工作階段已開始,預設不可切換(新工作階段可選)",
    ja: "セッションが開始済みのためプリセットは変更できません(新規セッションで選択可能)",
    ko: "세션이 이미 시작되어 프리셋을 전환할 수 없습니다(새 세션에서 선택 가능)",
    de: "Sitzung bereits gestartet: Preset nicht umschaltbar (für neue Sitzungen verfügbar)",
    fr: "Session déjà démarrée : le préréglage n'est pas modifiable (disponible pour les nouvelles sessions)",
    es: "Sesión ya iniciada: el preajuste no se puede cambiar (disponible en sesiones nuevas)",
    pt: "Sessão já iniciada: o preset não pode ser alterado (disponível em novas sessões)",
    th: "เซสชันเริ่มแล้ว จึงเปลี่ยนพรีเซ็ตไม่ได้ (ใช้ได้กับเซสชันใหม่)",
    id: "Sesi sudah dimulai: praset tidak dapat diganti (tersedia untuk sesi baru)",
    tr: "Oturum başladı: ön ayar değiştirilemez (yeni oturumlarda seçilebilir)",
    ru: "Сессия уже начата: пресет нельзя переключить (доступно для новых сессий)",
    ar: "بدأت الجلسة: لا يمكن تبديل الإعداد المسبق (متاح للجلسات الجديدة)",
  },
  "选择 Agent 预设(新会话生效)": {
    "zh-tw": "選擇 Agent 預設(新工作階段生效)",
    ja: "Agent プリセットを選択(新規セッションで有効)",
    ko: "Agent 프리셋 선택(새 세션에 적용)",
    de: "Agent-Preset wählen (gilt für neue Sitzungen)",
    fr: "Choisir un préréglage d'agent (s'applique aux nouvelles sessions)",
    es: "Elegir un preajuste de agente (se aplica a sesiones nuevas)",
    pt: "Escolher um preset de agente (vale para novas sessões)",
    th: "เลือกพรีเซ็ต Agent (มีผลกับเซสชันใหม่)",
    id: "Pilih praset Agent (berlaku untuk sesi baru)",
    tr: "Agent ön ayarını seçin (yeni oturumlarda geçerli)",
    ru: "Выберите пресет агента (действует для новых сессий)",
    ar: "اختر إعدادًا مسبقًا للوكيل (يُطبَّق على الجلسات الجديدة)",
  },
  "只读访问:不能修改文件或执行命令;外部文件与网络访问按策略询问": {
    "zh-tw": "唯讀存取:不能修改檔案或執行命令;外部檔案與網路存取依策略詢問",
    ja: "読み取り専用:ファイル変更やコマンド実行はできません。外部ファイルとネットワークはポリシーに従って確認します",
    ko: "읽기 전용: 파일을 수정하거나 명령을 실행할 수 없습니다. 외부 파일 및 네트워크 접근은 정책에 따라 확인합니다",
    de: "Nur Lesen: Dateien können nicht geändert und Befehle nicht ausgeführt werden; externer Datei- und Netzwerkzugriff wird richtlinienabhängig abgefragt",
    fr: "Lecture seule : impossible de modifier des fichiers ou d'exécuter des commandes ; l'accès aux fichiers externes et au réseau est demandé selon la politique",
    es: "Solo lectura: no se pueden modificar archivos ni ejecutar comandos; el acceso a archivos externos y a la red se solicita según la política",
    pt: "Somente leitura: não é possível modificar arquivos nem executar comandos; o acesso a arquivos externos e à rede é solicitado conforme a política",
    th: "อ่านอย่างเดียว: แก้ไขไฟล์หรือรันคำสั่งไม่ได้ การเข้าถึงไฟล์ภายนอกและเครือข่ายจะถามตามนโยบาย",
    id: "Hanya baca: tidak dapat mengubah berkas atau menjalankan perintah; akses berkas eksternal dan jaringan diminta sesuai kebijakan",
    tr: "Salt okunur: dosyalar değiştirilemez ve komut çalıştırılamaz; harici dosya ve ağ erişimi politikaya göre sorulur",
    ru: "Только чтение: нельзя изменять файлы и выполнять команды; доступ к внешним файлам и сети запрашивается по политике",
    ar: "قراءة فقط: لا يمكن تعديل الملفات أو تنفيذ الأوامر؛ يُطلب الوصول إلى الملفات الخارجية والشبكة وفق السياسة",
  },
  "可修改工作区内的文件;外部文件与网络访问按策略询问": {
    "zh-tw": "可修改工作區內的檔案;外部檔案與網路存取依策略詢問",
    ja: "ワークスペース内のファイルは変更可能。外部ファイルとネットワークはポリシーに従って確認します",
    ko: "워크스페이스 내 파일은 수정할 수 있습니다. 외부 파일 및 네트워크 접근은 정책에 따라 확인합니다",
    de: "Dateien im Arbeitsbereich können geändert werden; externer Datei- und Netzwerkzugriff wird richtlinienabhängig abgefragt",
    fr: "Les fichiers de l'espace de travail peuvent être modifiés ; l'accès aux fichiers externes et au réseau est demandé selon la politique",
    es: "Se pueden modificar archivos del espacio de trabajo; el acceso a archivos externos y a la red se solicita según la política",
    pt: "Arquivos do espaço de trabalho podem ser modificados; o acesso a arquivos externos e à rede é solicitado conforme a política",
    th: "แก้ไขไฟล์ในเวิร์กสเปซได้ การเข้าถึงไฟล์ภายนอกและเครือข่ายจะถามตามนโยบาย",
    id: "Berkas di dalam ruang kerja dapat diubah; akses berkas eksternal dan jaringan diminta sesuai kebijakan",
    tr: "Çalışma alanındaki dosyalar değiştirilebilir; harici dosya ve ağ erişimi politikaya göre sorulur",
    ru: "Файлы в рабочей области можно изменять; доступ к внешним файлам и сети запрашивается по политике",
    ar: "يمكن تعديل الملفات داخل مساحة العمل؛ يُطلب الوصول إلى الملفات الخارجية والشبكة وفق السياسة",
  },
  "可不受限制地访问互联网和你电脑上的任何文件": {
    "zh-tw": "可不受限制地存取網際網路與你電腦上的任何檔案",
    ja: "インターネットとコンピューター上のあらゆるファイルに無制限でアクセスできます",
    ko: "인터넷과 컴퓨터의 모든 파일에 제한 없이 접근할 수 있습니다",
    de: "Uneingeschränkter Zugriff auf das Internet und beliebige Dateien auf diesem Computer",
    fr: "Accès illimité à Internet et à tous les fichiers de votre ordinateur",
    es: "Acceso sin restricciones a Internet y a cualquier archivo de tu equipo",
    pt: "Acesso irrestrito à internet e a qualquer arquivo do seu computador",
    th: "เข้าถึงอินเทอร์เน็ตและไฟล์ใดก็ได้ในเครื่องของคุณโดยไม่มีข้อจำกัด",
    id: "Akses tanpa batas ke internet dan berkas apa pun di komputer Anda",
    tr: "İnternete ve bilgisayarınızdaki her dosyaya sınırsız erişim",
    ru: "Неограниченный доступ к интернету и любым файлам на компьютере",
    ar: "وصول غير مقيّد إلى الإنترنت وإلى أي ملف على جهازك",
  },
  "自定义组合(在设置中编辑)": {
    "zh-tw": "自訂組合(在設定中編輯)",
    ja: "カスタム構成(設定で編集)",
    ko: "사용자 지정 조합(설정에서 편집)",
    de: "Benutzerdefinierte Kombination (in den Einstellungen bearbeiten)",
    fr: "Combinaison personnalisée (à modifier dans les paramètres)",
    es: "Combinación personalizada (editar en los ajustes)",
    pt: "Combinação personalizada (editar nas configurações)",
    th: "ชุดผสมที่กำหนดเอง (แก้ไขในการตั้งค่า)",
    id: "Kombinasi khusus (edit di pengaturan)",
    tr: "Özel bileşim (ayarlardan düzenleyin)",
    ru: "Пользовательский набор (изменить в настройках)",
    ar: "تركيبة مخصصة (تُعدَّل في الإعدادات)",
  },
};

/** l10n 键 → 各语言译文(zh-cn/zh-tw 已有)。 */
const L10N_KEYS = {
  "notice.permissionBusy": {
    ja: "ターンが実行中です:権限プリセットは次のターンから適用されます。セッションが空いてから再試行してください。",
    ko: "턴이 실행 중입니다. 권한 프리셋은 다음 턴부터 적용됩니다. 세션이 유휴해진 뒤 다시 시도하세요.",
    de: "Ein Turn läuft: Das Berechtigungs-Preset gilt ab dem nächsten Turn. Versuchen Sie es erneut, wenn die Sitzung idle ist.",
    fr: "Un tour est en cours : le préréglage de permissions s'appliquera au tour suivant ; réessayez lorsque la session est inactive.",
    es: "Hay un turno en ejecución: el preajuste de permisos se aplicará en el siguiente turno; vuelve a intentarlo cuando la sesión esté inactiva.",
    pt: "Há um turno em execução: o preset de permissões será aplicado no próximo turno; tente novamente quando a sessão estiver ociosa.",
    th: "กำลังมีเทิร์นทำงานอยู่: พรีเซ็ตสิทธิ์จะมีผลในเทิร์นถัดไป ลองใหม่เมื่อเซสชันว่าง",
    id: "Ada turn yang sedang berjalan: praset izin akan berlaku pada turn berikutnya; coba lagi saat sesi menganggur.",
    tr: "Bir tur çalışıyor: izin ön ayarı sonraki turda geçerli olacak; oturum boştayken yeniden deneyin.",
    ru: "Идёт выполнение хода: пресет разрешений применится со следующего хода; повторите, когда сессия освободится.",
    ar: "هناك دور قيد التنفيذ: سيُطبَّق إعداد الأذونات في الدور التالي؛ أعد المحاولة عندما تصبح الجلسة خاملة.",
  },
  "hub.modelNoImages": {
    ja: "現在のモデル「{model}」は画像入力に対応していません:画像の添付を外すか、入力欄右上のモデルボタンから画像対応モデルに切り替えてください。",
    ko: "현재 모델 \"{model}\"은(는) 이미지 입력을 지원하지 않습니다. 이미지 첨부를 제거하거나 입력창 오른쪽 위의 모델 버튼에서 이미지 지원 모델로 전환하세요.",
    de: "Das aktuelle Modell \"{model}\" unterstützt keine Bildeingabe: Bildanhänge entfernen oder über die Modelltaste oben rechts im Eingabefeld zu einem bildfähigen Modell wechseln.",
    fr: "Le modèle actuel « {model} » ne prend pas en charge les images : retirez les pièces jointes ou choisissez un modèle compatible via le bouton de modèle en haut à droite de la zone de saisie.",
    es: "El modelo actual \"{model}\" no admite imágenes: quita los adjuntos de imagen o cambia a un modelo compatible con imágenes con el botón de modelo de la esquina superior derecha del cuadro de entrada.",
    pt: "O modelo atual \"{model}\" não aceita imagens: remova os anexos de imagem ou mude para um modelo compatível pelo botão de modelo no canto superior direito da caixa de entrada.",
    th: "โมเดลปัจจุบัน \"{model}\" ไม่รองรับการป้อนรูปภาพ: ลบไฟล์แนบรูปภาพออก หรือเปลี่ยนเป็นโมเดลที่รองรับรูปภาพผ่านปุ่มโมเดลมุมขวาบนของช่องพิมพ์",
    id: "Model saat ini \"{model}\" tidak mendukung masukan gambar: hapus lampiran gambar, atau beralih ke model yang mendukung gambar lewat tombol model di kanan atas kotak masukan.",
    tr: "Geçerli model \"{model}\" görsel girişini desteklemiyor: görsel eklerini kaldırın veya giriş kutusunun sağ üst köşesindeki model düğmesinden görsel destekli bir modele geçin.",
    ru: "Текущая модель «{model}» не поддерживает изображения: удалите вложения-изображения или переключитесь на модель с поддержкой изображений кнопкой модели в правом верхнем углу поля ввода.",
    ar: "الطراز الحالي \"{model}\" لا يدعم إدخال الصور: أزل مرفقات الصور، أو بدّل إلى طراز يدعم الصور من زر الطراز أعلى يمين مربع الإدخال.",
  },
};

let webviewAdded = 0;
for (const file of fs.readdirSync(path.join(root, "src/webview/texts"))) {
  const lang = file.replace(/\.json$/, "");
  const full = path.join(root, "src/webview/texts", file);
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
for (const file of fs.readdirSync(path.join(root, "l10n"))) {
  if (!/^bundle\.l10n\..*\.json$/.test(file)) continue;
  const lang = file.replace(/^bundle\.l10n\./, "").replace(/\.json$/, "");
  const full = path.join(root, "l10n", file);
  const dict = JSON.parse(fs.readFileSync(full, "utf8"));
  let changed = false;
  for (const [key, byLang] of Object.entries(L10N_KEYS)) {
    if (dict[key] === undefined && byLang[lang] !== undefined) {
      dict[key] = byLang[lang];
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(full, `${JSON.stringify(dict, null, 2)}\n`, "utf8");
    l10nAdded++;
  }
}

console.log(`webview dictionaries updated: ${webviewAdded}`);
console.log(`l10n bundles updated: ${l10nAdded}`);
