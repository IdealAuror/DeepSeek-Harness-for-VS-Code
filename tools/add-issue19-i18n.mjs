/**
 * issue #19 新增界面文案:上下文超限/回合失败的对话内提示卡、发送前上下文守卫、
 * 上下文进度环的警告/危险分档。
 * 中文为源键基准:en 走 ui.ts 的 EN_TEXT,其余 12 个语言包写 src/webview/texts/*.json。
 */
import fs from "node:fs";
import path from "node:path";

const root = "D:/Workspace/vscode";

const KEYS = {
  "上下文接近上限": {
    "zh-tw": "上下文接近上限",
    ja: "コンテキストが上限に接近",
    ko: "컨텍스트가 한도에 근접",
    de: "Kontext nahe am Limit",
    fr: "Contexte proche de la limite",
    es: "Contexto cerca del límite",
    pt: "Contexto perto do limite",
    th: "บริบทใกล้ถึงขีดจำกัด",
    id: "Konteks mendekati batas",
    tr: "Bağlam sınıra yaklaştı",
    ru: "Контекст близок к пределу",
    ar: "السياق يقترب من الحد",
  },
  "上下文接近模型上限,建议先压缩": {
    "zh-tw": "上下文接近模型上限,建議先壓縮",
    ja: "コンテキストがモデル上限に近づいています。先に圧縮してください",
    ko: "컨텍스트가 모델 한도에 근접했습니다. 먼저 압축하세요",
    de: "Der Kontext nähert sich dem Modelllimit – zuerst verdichten",
    fr: "Le contexte approche la limite du modèle — compressez d'abord",
    es: "El contexto se acerca al límite del modelo: comprime primero",
    pt: "O contexto se aproxima do limite do modelo: compacte primeiro",
    th: "บริบทใกล้ถึงขีดจำกัดของโมเดล ควรบีบอัดก่อน",
    id: "Konteks mendekati batas model — padatkan dulu",
    tr: "Bağlam model sınırına yaklaşıyor — önce sıkıştırın",
    ru: "Контекст приближается к пределу модели — сначала сожмите его",
    ar: "السياق يقترب من حد النموذج — اضغطه أولًا",
  },
  "上下文接近模型上限,建议压缩后再继续": {
    "zh-tw": "上下文接近模型上限,建議壓縮後再繼續",
    ja: "コンテキストがモデル上限に近づいています。圧縮してから続けてください",
    ko: "컨텍스트가 모델 한도에 근접했습니다. 압축한 뒤 계속하세요",
    de: "Der Kontext nähert sich dem Modelllimit – erst verdichten, dann fortfahren",
    fr: "Le contexte approche la limite du modèle — compressez avant de continuer",
    es: "El contexto se acerca al límite del modelo: comprime antes de continuar",
    pt: "O contexto se aproxima do limite do modelo: compacte antes de continuar",
    th: "บริบทใกล้ถึงขีดจำกัดของโมเดล ควรบีบอัดก่อนดำเนินการต่อ",
    id: "Konteks mendekati batas model — padatkan sebelum melanjutkan",
    tr: "Bağlam model sınırına yaklaşıyor — devam etmeden önce sıkıştırın",
    ru: "Контекст приближается к пределу модели — сожмите его, прежде чем продолжать",
    ar: "السياق يقترب من حد النموذج — اضغطه قبل المتابعة",
  },
  "接近模型上限,建议先压缩上下文": {
    "zh-tw": "接近模型上限,建議先壓縮上下文",
    ja: "モデル上限に接近。先にコンテキストを圧縮してください",
    ko: "모델 한도에 근접했습니다. 먼저 컨텍스트를 압축하세요",
    de: "Nahe am Modelllimit – zuerst den Kontext verdichten",
    fr: "Proche de la limite du modèle — compressez d'abord le contexte",
    es: "Cerca del límite del modelo: comprime primero el contexto",
    pt: "Perto do limite do modelo: compacte primeiro o contexto",
    th: "ใกล้ขีดจำกัดของโมเดล ควรบีบอัดบริบทก่อน",
    id: "Mendekati batas model — padatkan konteks dulu",
    tr: "Model sınırına yakın — önce bağlamı sıkıştırın",
    ru: "Близко к пределу модели — сначала сожмите контекст",
    ar: "قريب من حد النموذج — اضغط السياق أولًا",
  },
  "上下文接近上限,可考虑压缩": {
    "zh-tw": "上下文接近上限,可考慮壓縮",
    ja: "コンテキストが上限に近づいています。圧縮を検討してください",
    ko: "컨텍스트가 한도에 근접했습니다. 압축을 고려하세요",
    de: "Der Kontext nähert sich dem Limit – Verdichten erwägen",
    fr: "Le contexte approche la limite — envisagez de compresser",
    es: "El contexto se acerca al límite: considera comprimir",
    pt: "O contexto se aproxima do limite: considere compactar",
    th: "บริบทใกล้ถึงขีดจำกัด ควรพิจารณาบีบอัด",
    id: "Konteks mendekati batas — pertimbangkan memadatkan",
    tr: "Bağlam sınıra yaklaşıyor — sıkıştırmayı düşünün",
    ru: "Контекст приближается к пределу — подумайте о сжатии",
    ar: "السياق يقترب من الحد — فكّر في الضغط",
  },
  "上下文已用 {p},可考虑压缩": {
    "zh-tw": "上下文已用 {p},可考慮壓縮",
    ja: "コンテキストは {p} 使用済み。圧縮を検討してください",
    ko: "컨텍스트 {p} 사용 — 압축을 고려하세요",
    de: "{p} des Kontexts belegt – Verdichten erwägen",
    fr: "{p} du contexte utilisé — envisagez de compresser",
    es: "{p} del contexto usado: considera comprimir",
    pt: "{p} do contexto usado: considere compactar",
    th: "ใช้บริบทไปแล้ว {p} ควรพิจารณาบีบอัด",
    id: "{p} konteks terpakai — pertimbangkan memadatkan",
    tr: "Bağlamın {p} kadarı kullanıldı — sıkıştırmayı düşünün",
    ru: "Использовано {p} контекста — подумайте о сжатии",
    ar: "استُخدم {p} من السياق — فكّر في الضغط",
  },
  "切换模型": {
    "zh-tw": "切換模型",
    ja: "モデルを切り替え",
    ko: "모델 전환",
    de: "Modell wechseln",
    fr: "Changer de modèle",
    es: "Cambiar de modelo",
    pt: "Trocar de modelo",
    th: "สลับโมเดล",
    id: "Ganti model",
    tr: "Modeli değiştir",
    ru: "Сменить модель",
    ar: "تبديل النموذج",
  },
  "打开模型列表,换用上下文窗口更大的模型": {
    "zh-tw": "開啟模型清單,改用上下文視窗更大的模型",
    ja: "モデル一覧を開き、より大きなコンテキストウィンドウのモデルに切り替えます",
    ko: "모델 목록을 열어 더 큰 컨텍스트 창을 가진 모델로 전환합니다",
    de: "Modellliste öffnen und ein Modell mit größerem Kontextfenster wählen",
    fr: "Ouvrir la liste des modèles et choisir un modèle à fenêtre de contexte plus grande",
    es: "Abrir la lista de modelos y elegir uno con mayor ventana de contexto",
    pt: "Abrir a lista de modelos e escolher um com janela de contexto maior",
    th: "เปิดรายการโมเดลและเลือกโมเดลที่มีหน้าต่างบริบทใหญ่ขึ้น",
    id: "Buka daftar model dan pilih model dengan jendela konteks lebih besar",
    tr: "Model listesini açıp daha büyük bağlam pencereli bir model seçin",
    ru: "Открыть список моделей и выбрать модель с большим окном контекста",
    ar: "افتح قائمة النماذج واختر نموذجًا بنافذة سياق أكبر",
  },
  "回合失败": {
    "zh-tw": "回合失敗",
    ja: "ターンが失敗しました",
    ko: "턴 실패",
    de: "Turn fehlgeschlagen",
    fr: "Échec du tour",
    es: "Falló el turno",
    pt: "Falha no turno",
    th: "รอบล้มเหลว",
    id: "Turn gagal",
    tr: "Tur başarısız",
    ru: "Ход завершился ошибкой",
    ar: "فشل الدور",
  },
  "已达模型输出上限": {
    "zh-tw": "已達模型輸出上限",
    ja: "モデルの出力上限に達しました",
    ko: "모델 출력 한도 도달",
    de: "Ausgabelimit des Modells erreicht",
    fr: "Limite de sortie du modèle atteinte",
    es: "Se alcanzó el límite de salida del modelo",
    pt: "Limite de saída do modelo atingido",
    th: "ถึงขีดจำกัดเอาต์พุตของโมเดลแล้ว",
    id: "Batas keluaran model tercapai",
    tr: "Model çıktı sınırına ulaşıldı",
    ru: "Достигнут предел вывода модели",
    ar: "تم بلوغ حد إخراج النموذج",
  },
  "模型在本回合达到最大输出 token 数,回答可能被截断;可让它继续,或改用更小的任务重试。": {
    "zh-tw": "模型在本回合達到最大輸出 token 數,回答可能被截斷;可讓它繼續,或改用更小的任務重試。",
    ja: "このターンでモデルが最大出力トークン数に達したため、回答が途中で切れている可能性があります。続きを求めるか、より小さなタスクに分けて再試行してください。",
    ko: "이번 턴에서 모델이 최대 출력 토큰에 도달해 답변이 잘렸을 수 있습니다. 계속 요청하거나 더 작은 작업으로 나눠 다시 시도하세요.",
    de: "Das Modell hat in diesem Turn die maximale Ausgabelänge erreicht; die Antwort kann abgeschnitten sein. Lassen Sie es fortfahren oder teilen Sie die Aufgabe kleiner auf.",
    fr: "Le modèle a atteint son maximum de tokens de sortie sur ce tour ; la réponse peut être tronquée. Demandez-lui de continuer ou découpez la tâche.",
    es: "El modelo alcanzó su máximo de tokens de salida en este turno; la respuesta puede estar truncada. Pídele que continúe o divide la tarea.",
    pt: "O modelo atingiu o máximo de tokens de saída neste turno; a resposta pode estar truncada. Peça para continuar ou divida a tarefa.",
    th: "โมเดลใช้โทเคนเอาต์พุตครบขีดสูงสุดในรอบนี้ คำตอบอาจถูกตัด ให้มันทำต่อหรือแบ่งงานให้เล็กลงแล้วลองใหม่",
    id: "Model mencapai token keluaran maksimum pada turn ini; jawaban mungkin terpotong. Minta lanjut atau pecah tugasnya.",
    tr: "Model bu turda en fazla çıktı tokenına ulaştı; yanıt kesilmiş olabilir. Devam etmesini isteyin veya görevi küçültün.",
    ru: "Модель достигла предела выходных токенов в этом ходе; ответ может быть обрезан. Попросите продолжить или разделите задачу.",
    ar: "بلغ النموذج الحد الأقصى لرموز الإخراج في هذا الدور، وقد تكون الإجابة مقطوعة؛ اطلب منه المتابعة أو قسّم المهمة.",
  },
  "上下文已超出模型窗口": {
    "zh-tw": "上下文已超出模型視窗",
    ja: "コンテキストがモデルのウィンドウを超えました",
    ko: "컨텍스트가 모델 창을 초과했습니다",
    de: "Kontext überschreitet das Modellfenster",
    fr: "Le contexte dépasse la fenêtre du modèle",
    es: "El contexto supera la ventana del modelo",
    pt: "O contexto excedeu a janela do modelo",
    th: "บริบทเกินหน้าต่างของโมเดลแล้ว",
    id: "Konteks melampaui jendela model",
    tr: "Bağlam model penceresini aştı",
    ru: "Контекст превысил окно модели",
    ar: "تجاوز السياق نافذة النموذج",
  },
  "当前上下文约 {used} / {limit} tokens,已超出该模型的上下文窗口:{message}": {
    "zh-tw": "目前上下文約 {used} / {limit} tokens,已超出該模型的上下文視窗:{message}",
    ja: "現在のコンテキストは約 {used} / {limit} トークンで、このモデルのコンテキストウィンドウを超えています: {message}",
    ko: "현재 컨텍스트는 약 {used} / {limit} 토큰으로 이 모델의 컨텍스트 창을 초과했습니다: {message}",
    de: "Der aktuelle Kontext umfasst etwa {used} / {limit} Tokens und überschreitet das Kontextfenster dieses Modells: {message}",
    fr: "Le contexte actuel fait environ {used} / {limit} tokens, au-delà de la fenêtre de ce modèle : {message}",
    es: "El contexto actual es de unos {used} / {limit} tokens, por encima de la ventana de este modelo: {message}",
    pt: "O contexto atual tem cerca de {used} / {limit} tokens, acima da janela deste modelo: {message}",
    th: "บริบทปัจจุบันประมาณ {used} / {limit} โทเคน เกินหน้าต่างของโมเดลนี้แล้ว: {message}",
    id: "Konteks saat ini sekitar {used} / {limit} token, melewati jendela model ini: {message}",
    tr: "Geçerli bağlam yaklaşık {used} / {limit} token ve bu modelin penceresini aşıyor: {message}",
    ru: "Текущий контекст — около {used} / {limit} токенов, это больше окна данной модели: {message}",
    ar: "السياق الحالي نحو {used} / {limit} رمزًا، وهو يتجاوز نافذة هذا النموذج: {message}",
  },
  "当前上下文已超出该模型的上下文窗口:{message}": {
    "zh-tw": "目前上下文已超出該模型的上下文視窗:{message}",
    ja: "現在のコンテキストはこのモデルのコンテキストウィンドウを超えています: {message}",
    ko: "현재 컨텍스트가 이 모델의 컨텍스트 창을 초과했습니다: {message}",
    de: "Der aktuelle Kontext überschreitet das Kontextfenster dieses Modells: {message}",
    fr: "Le contexte actuel dépasse la fenêtre de contexte de ce modèle : {message}",
    es: "El contexto actual supera la ventana de contexto de este modelo: {message}",
    pt: "O contexto atual excede a janela de contexto deste modelo: {message}",
    th: "บริบทปัจจุบันเกินหน้าต่างบริบทของโมเดลนี้แล้ว: {message}",
    id: "Konteks saat ini melewati jendela konteks model ini: {message}",
    tr: "Geçerli bağlam bu modelin bağlam penceresini aşıyor: {message}",
    ru: "Текущий контекст превышает окно контекста этой модели: {message}",
    ar: "السياق الحالي يتجاوز نافذة سياق هذا النموذج: {message}",
  },
  "本次输入预计使上下文达到约 {used} / {limit} tokens,已超出该模型窗口;宿主会自动压缩或重试,若失败请手动压缩或换用更大窗口的模型。": {
    "zh-tw": "本次輸入預計使上下文達到約 {used} / {limit} tokens,已超出該模型視窗;宿主會自動壓縮或重試,若失敗請手動壓縮或改用更大視窗的模型。",
    ja: "この入力でコンテキストは約 {used} / {limit} トークンに達し、モデルのウィンドウを超えます。ホストが自動で圧縮・再試行しますが、失敗した場合は手動で圧縮するか、より大きなウィンドウのモデルに切り替えてください。",
    ko: "이 입력으로 컨텍스트가 약 {used} / {limit} 토큰에 이르러 모델 창을 초과합니다. 호스트가 자동으로 압축·재시도하며, 실패하면 직접 압축하거나 더 큰 창의 모델로 전환하세요.",
    de: "Diese Eingabe bringt den Kontext auf etwa {used} / {limit} Tokens und überschreitet das Modellfenster. Der Host verdichtet und wiederholt automatisch; schlägt das fehl, verdichten Sie manuell oder wechseln Sie das Modell.",
    fr: "Cette saisie porte le contexte à environ {used} / {limit} tokens, au-delà de la fenêtre du modèle. L'hôte compresse et réessaie automatiquement ; en cas d'échec, compressez manuellement ou changez de modèle.",
    es: "Esta entrada lleva el contexto a unos {used} / {limit} tokens, por encima de la ventana del modelo. El host comprime y reintenta automáticamente; si falla, comprime a mano o cambia de modelo.",
    pt: "Esta entrada leva o contexto a cerca de {used} / {limit} tokens, acima da janela do modelo. O host compacta e tenta de novo automaticamente; se falhar, compacte manualmente ou troque de modelo.",
    th: "การป้อนนี้จะทำให้บริบทถึงประมาณ {used} / {limit} โทเคน เกินหน้าต่างของโมเดล โฮสต์จะบีบอัดและลองใหม่ให้เอง หากล้มเหลวให้บีบอัดเองหรือเปลี่ยนไปใช้โมเดลที่หน้าต่างใหญ่ขึ้น",
    id: "Input ini membawa konteks ke sekitar {used} / {limit} token, melewati jendela model. Host akan memadatkan dan mencoba ulang otomatis; jika gagal, padatkan manual atau ganti ke model berjendela lebih besar.",
    tr: "Bu giriş bağlamı yaklaşık {used} / {limit} tokena çıkararak model penceresini aşıyor. Ana süreç otomatik sıkıştırıp yeniden dener; başarısız olursa elle sıkıştırın veya daha büyük pencereli bir modele geçin.",
    ru: "Этот ввод доводит контекст примерно до {used} / {limit} токенов — больше окна модели. Хост сам сожмёт и повторит; если не выйдет, сожмите вручную или смените модель на модель с большим окном.",
    ar: "هذا الإدخال يرفع السياق إلى نحو {used} / {limit} رمزًا، متجاوزًا نافذة النموذج. سيضغطه المضيف ويعيد المحاولة تلقائيًا؛ وإن فشل فاضغطه يدويًا أو انتقل إلى نموذج بنافذة أكبر.",
  },
  "本次输入预计使上下文达到约 {used} / {limit} tokens,接近该模型窗口上限;建议先压缩上下文再继续。": {
    "zh-tw": "本次輸入預計使上下文達到約 {used} / {limit} tokens,接近該模型視窗上限;建議先壓縮上下文再繼續。",
    ja: "この入力でコンテキストは約 {used} / {limit} トークンに達し、モデルのウィンドウ上限に近づきます。先にコンテキストを圧縮してから続けてください。",
    ko: "이 입력으로 컨텍스트가 약 {used} / {limit} 토큰에 이르러 모델 창 한도에 근접합니다. 먼저 컨텍스트를 압축한 뒤 계속하세요.",
    de: "Diese Eingabe bringt den Kontext auf etwa {used} / {limit} Tokens und damit nahe an das Fensterlimit. Verdichten Sie den Kontext, bevor Sie fortfahren.",
    fr: "Cette saisie porte le contexte à environ {used} / {limit} tokens, près de la limite de la fenêtre. Compressez le contexte avant de continuer.",
    es: "Esta entrada lleva el contexto a unos {used} / {limit} tokens, cerca del límite de la ventana. Comprime el contexto antes de continuar.",
    pt: "Esta entrada leva o contexto a cerca de {used} / {limit} tokens, perto do limite da janela. Compacte o contexto antes de continuar.",
    th: "การป้อนนี้จะทำให้บริบทถึงประมาณ {used} / {limit} โทเคน ใกล้ขีดจำกัดหน้าต่างของโมเดล ควรบีบอัดบริบทก่อนดำเนินการต่อ",
    id: "Input ini membawa konteks ke sekitar {used} / {limit} token, mendekati batas jendela model. Padatkan konteks sebelum melanjutkan.",
    tr: "Bu giriş bağlamı yaklaşık {used} / {limit} tokena çıkararak pencere sınırına yaklaştırıyor. Devam etmeden önce bağlamı sıkıştırın.",
    ru: "Этот ввод доводит контекст примерно до {used} / {limit} токенов — близко к пределу окна. Сожмите контекст, прежде чем продолжать.",
    ar: "هذا الإدخال يرفع السياق إلى نحو {used} / {limit} رمزًا، قريبًا من حد النافذة. اضغط السياق قبل المتابعة.",
  },
  "宿主未提供失败详情(旧版宿主或运行中止)": {
    "zh-tw": "宿主未提供失敗詳情(舊版宿主或執行中止)",
    ja: "ホストが失敗の詳細を提供していません(旧版ホスト、または実行中断)",
    ko: "호스트가 실패 상세를 제공하지 않았습니다(구버전 호스트 또는 실행 중단)",
    de: "Der Host hat keine Fehlerdetails geliefert (älterer Host oder abgebrochener Lauf)",
    fr: "L'hôte n'a fourni aucun détail d'échec (hôte plus ancien ou exécution interrompue)",
    es: "El host no proporcionó detalles del fallo (host antiguo o ejecución interrumpida)",
    pt: "O host não forneceu detalhes da falha (host antigo ou execução interrompida)",
    th: "โฮสต์ไม่ได้ให้รายละเอียดความล้มเหลว (โฮสต์รุ่นเก่าหรือการทำงานถูกขัดจังหวะ)",
    id: "Host tidak memberikan detail kegagalan (host lama atau eksekusi terhenti)",
    tr: "Ana süreç hata ayrıntısı vermedi (eski sürüm veya kesilen çalışma)",
    ru: "Хост не передал подробности ошибки (старый хост или прерванный запуск)",
    ar: "لم يوفّر المضيف تفاصيل الفشل (مضيف أقدم أو تنفيذ متوقف)",
  },
};

const dir = path.join(root, "src/webview/texts");
let updated = 0;
for (const file of fs.readdirSync(dir)) {
  if (!file.endsWith(".json")) continue;
  const lang = file.replace(/\.json$/, "");
  const full = path.join(dir, file);
  const raw = fs.readFileSync(full, "utf8");
  const dict = JSON.parse(raw);
  const additions = [];
  for (const [key, byLang] of Object.entries(KEYS)) {
    if (dict[key] !== undefined) continue;
    const value = byLang[lang];
    if (value === undefined) continue;
    additions.push(`  ${JSON.stringify(key)}: ${JSON.stringify(value)}`);
  }
  if (additions.length === 0) continue;
  // 逐行追加到最后一个 "}" 之前,保持既有条目与格式原样
  const lines = raw.replace(/\r\n/g, "\n").replace(/\n+$/, "").split("\n");
  const closeIdx = lines.length - 1;
  if (lines[closeIdx].trim() !== "}") throw new Error(`${file}: unexpected tail`);
  const lastEntryIdx = closeIdx - 1;
  if (lastEntryIdx >= 1 && !lines[lastEntryIdx].trimEnd().endsWith(",")) lines[lastEntryIdx] = `${lines[lastEntryIdx]},`;
  lines.splice(closeIdx, 0, ...additions.map((line, i) => (i === additions.length - 1 ? line : `${line},`)));
  fs.writeFileSync(full, `${lines.join("\n")}\n`, "utf8");
  updated++;
}
console.log(`webview dictionaries updated: ${updated}/${Object.keys(KEYS).length} keys x ${fs.readdirSync(dir).length} files`);
