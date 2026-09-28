/**
 * 修正「生成提交信息」的两个缺陷带来的配置面变化:
 * 1) dsh.commitModel 默认值由具体型号 deepseek-v4-flash 改为关键字 flash
 *    (按目录做包含匹配,部署里只有 deepseek-flash / deepseek-v4-pro 时也能命中);
 * 2) 说明文案改为「生成结束后恢复原默认模型」,不再声称会永久切换模型。
 * 只改这两个键,不动其它内容。
 */
import fs from "node:fs";
import path from "node:path";

const root = "D:/Workspace/vscode";

const DESCRIPTIONS = {
  "package.nls.json":
    "Model keyword used to generate git commit messages from the Source Control view. Matched against the DSH model catalog by id or name (default \"flash\" picks the lightweight model, e.g. deepseek-flash); the session's current model is used when the keyword matches nothing. The switch is temporary: your default model and thinking depth are restored after generation.",
  "package.nls.zh-cn.json":
    "源代码管理视图中生成提交信息所用的模型关键字。按 id 或名称在 DSH 模型目录中匹配(默认 \"flash\" 命中轻量模型,如 deepseek-flash);关键字无命中时使用该会话当前模型。切换是临时的:生成结束后会恢复你原来的默认模型与思考深度。",
  "package.nls.zh-tw.json":
    "用來從原始檔控制檢視產生 git 提交訊息的模型關鍵字。依 id 或名稱在 DSH 模型目錄中比對(預設 \"flash\" 命中輕量模型,例如 deepseek-flash);關鍵字無命中時使用工作階段目前的模型。切換是暫時的:產生結束後會還原你原本的預設模型與思考深度。",
  "package.nls.ja.json":
    "ソース管理ビューから git コミットメッセージを生成するモデルのキーワード。DSH のモデルカタログを id または名前で照合します(既定の \"flash\" は軽量モデル、例: deepseek-flash)。一致しない場合はセッションの現在のモデルを使用します。切り替えは一時的で、生成後は元の既定モデルと思考深度に戻ります。",
  "package.nls.ko.json":
    "소스 제어 보기에서 git 커밋 메시지를 생성하는 데 사용할 모델 키워드입니다. DSH 모델 카탈로그를 id 또는 이름으로 대조합니다(기본 \"flash\"는 경량 모델, 예: deepseek-flash). 일치하는 모델이 없으면 세션의 현재 모델을 사용합니다. 전환은 일시적이며 생성 후 원래 기본 모델과 사고 깊이로 복원됩니다.",
  "package.nls.de.json":
    "Modell-Schlüsselwort zum Generieren von Git-Commit-Meldungen aus der Quellcodeverwaltung. Wird per ID oder Name gegen den DSH-Modellkatalog geprüft (Standard \"flash\" wählt das leichte Modell, z. B. deepseek-flash); ohne Treffer wird das aktuelle Sitzungsmodell verwendet. Die Umschaltung ist temporär: Standardmodell und Denkaufwand werden nach der Generierung wiederhergestellt.",
  "package.nls.fr.json":
    "Mot-clé de modèle utilisé pour générer les messages de commit git depuis la vue Contrôle de code source. Comparé au catalogue de modèles DSH par id ou par nom (\"flash\" par défaut choisit le modèle léger, p. ex. deepseek-flash) ; le modèle actuel de la session est utilisé sans correspondance. Le changement est temporaire : votre modèle et votre effort de raisonnement par défaut sont restaurés après la génération.",
  "package.nls.es.json":
    "Palabra clave del modelo usado para generar mensajes de confirmación de git desde la vista Control de código fuente. Se compara con el catálogo de modelos de DSH por id o nombre (\"flash\" por defecto elige el modelo ligero, p. ej. deepseek-flash); si no hay coincidencia se usa el modelo actual de la sesión. El cambio es temporal: tu modelo y esfuerzo de razonamiento predeterminados se restauran tras generar.",
  "package.nls.pt.json":
    "Palavra-chave do modelo usado para gerar mensagens de commit do git na exibição Controle de Código-Fonte. Comparada ao catálogo de modelos do DSH por id ou nome (\"flash\" por padrão escolhe o modelo leve, ex.: deepseek-flash); sem correspondência, usa o modelo atual da sessão. A troca é temporária: seu modelo e esforço de raciocínio padrão são restaurados após a geração.",
  "package.nls.th.json":
    "คีย์เวิร์ดโมเดลที่ใช้สร้างข้อความ git commit จากมุมมอง Source Control จับคู่กับแคตตาล็อกโมเดลของ DSH ตาม id หรือชื่อ (ค่าเริ่มต้น \"flash\" จะเลือกโมเดลน้ำหนักเบา เช่น deepseek-flash) หากไม่พบจะใช้โมเดลปัจจุบันของเซสชัน การสลับเป็นเพียงชั่วคราว: โมเดลและระดับการคิดเริ่มต้นของคุณจะถูกคืนค่าหลังสร้างเสร็จ",
  "package.nls.id.json":
    "Kata kunci model untuk membuat pesan commit git dari tampilan Source Control. Dicocokkan dengan katalog model DSH berdasarkan id atau nama (\"flash\" bawaan memilih model ringan, mis. deepseek-flash); tanpa kecocokan, model sesi saat ini dipakai. Penggantian bersifat sementara: model dan tingkat penalaran bawaan Anda dipulihkan setelah pembuatan.",
  "package.nls.tr.json":
    "Kaynak Denetimi görünümünden git commit mesajı oluşturmak için kullanılan model anahtar sözcüğü. DSH model kataloğuyla kimlik veya ada göre eşleştirilir (varsayılan \"flash\" hafif modeli seçer, örn. deepseek-flash); eşleşme yoksa oturumun geçerli modeli kullanılır. Değişiklik geçicidir: üretimden sonra varsayılan modeliniz ve düşünme düzeyiniz geri yüklenir.",
  "package.nls.ru.json":
    "Ключевое слово модели для генерации сообщений коммитов Git из представления системы управления версиями. Сопоставляется с каталогом моделей DSH по id или имени (по умолчанию \"flash\" выбирает лёгкую модель, например deepseek-flash); без совпадений используется текущая модель сессии. Переключение временное: ваш обычный выбор модели и глубины рассуждений восстанавливается после генерации.",
  "package.nls.ar.json":
    "كلمة مفتاحية للطراز المستخدم لتوليد رسائل الالتزام (commit) في git من عرض التحكم بالمصدر. تُطابَق مع كتالوج طرازات DSH بالمعرّف أو الاسم (القيمة الافتراضية \"flash\" تختار الطراز الخفيف، مثل deepseek-flash)؛ وعند عدم وجود تطابق يُستخدم طراز الجلسة الحالي. التبديل مؤقت: يُستعاد طرازك الافتراضي ومستوى التفكير بعد التوليد.",
};

const EFFORT = {
  "package.nls.json":
    "Reasoning effort for commit message generation. \"low\" means no/minimal thinking on DeepSeek models (fastest). The temporary switch is reverted after generation, so your default thinking depth is never changed.",
  "package.nls.zh-cn.json":
    "生成提交信息时的思考深度。DeepSeek 模型上 \"low\" 表示不开思考(最快)。临时切换会在生成结束后还原,不会改动你的默认思考深度。",
  "package.nls.zh-tw.json":
    "產生 git 提交訊息時的思考深度。DeepSeek 模型上 \"low\" 表示不開思考(最快)。暫時切換會在產生結束後還原,不會改動你的預設思考深度。",
  "package.nls.ja.json":
    "コミットメッセージ生成時の思考深度。DeepSeek モデルでは \"low\" は思考なし(最速)を意味します。一時的な切り替えは生成後に元に戻るため、既定の思考深度は変更されません。",
  "package.nls.ko.json":
    "커밋 메시지 생성 시의 사고 깊이입니다. DeepSeek 모델에서 \"low\"는 사고 없음(가장 빠름)을 뜻합니다. 임시 전환은 생성 후 되돌려지므로 기본 사고 깊이는 바뀌지 않습니다.",
  "package.nls.de.json":
    "Denkaufwand für die Commit-Meldungsgenerierung. \"low\" bedeutet auf DeepSeek-Modellen kein/minimales Denken (am schnellsten). Die temporäre Umschaltung wird nach der Generierung zurückgesetzt; Ihr Standard-Denkaufwand bleibt unverändert.",
  "package.nls.fr.json":
    "Effort de raisonnement pour la génération du message de commit. « low » signifie aucun/minimal de raisonnement sur les modèles DeepSeek (le plus rapide). Le changement temporaire est annulé après la génération : votre effort par défaut n'est jamais modifié.",
  "package.nls.es.json":
    "Esfuerzo de razonamiento para generar el mensaje de confirmación. \"low\" significa sin razonamiento o mínimo en modelos DeepSeek (lo más rápido). El cambio temporal se revierte tras generar, así que tu esfuerzo predeterminado nunca cambia.",
  "package.nls.pt.json":
    "Esforço de raciocínio para gerar a mensagem de commit. \"low\" significa nenhum/mínimo raciocínio nos modelos DeepSeek (o mais rápido). A troca temporária é revertida após a geração, então seu esforço padrão nunca muda.",
  "package.nls.th.json":
    "ระดับการคิดสำหรับการสร้างข้อความ commit บนโมเดล DeepSeek \"low\" หมายถึงไม่คิดหรือคิดน้อยที่สุด (เร็วที่สุด) การสลับชั่วคราวจะถูกคืนค่าหลังสร้างเสร็จ ระดับการคิดเริ่มต้นของคุณจึงไม่เปลี่ยน",
  "package.nls.id.json":
    "Tingkat penalaran untuk pembuatan pesan commit. \"low\" berarti tanpa/minim penalaran pada model DeepSeek (paling cepat). Penggantian sementara dikembalikan setelah pembuatan, jadi tingkat penalaran bawaan Anda tidak berubah.",
  "package.nls.tr.json":
    "Commit mesajı üretimi için düşünme düzeyi. DeepSeek modellerinde \"low\" düşünme yok/minimum demektir (en hızlısı). Geçici değişiklik üretimden sonra geri alınır; varsayılan düşünme düzeyiniz değişmez.",
  "package.nls.ru.json":
    "Глубина рассуждений при генерации сообщения коммита. \"low\" на моделях DeepSeek означает отсутствие/минимум рассуждений (быстрее всего). Временное переключение откатывается после генерации, поэтому ваша обычная глубина не меняется.",
  "package.nls.ar.json":
    "مستوى التفكير عند توليد رسالة الالتزام. القيمة \"low\" تعني بلا تفكير أو بأدنى حد على طرازات DeepSeek (الأسرع). التبديل المؤقت يُرجَع بعد التوليد، لذا لا يتغير مستوى تفكيرك الافتراضي.",
};

for (const [file, value] of Object.entries(DESCRIPTIONS)) {
  const full = path.join(root, file);
  const dict = JSON.parse(fs.readFileSync(full, "utf8"));
  dict["config.commitModel"] = value;
  dict["config.commitReasoningEffort"] = EFFORT[file];
  fs.writeFileSync(full, `${JSON.stringify(dict, null, 2)}\n`, "utf8");
}

// package.json:默认值改为关键字 flash
const pkgPath = path.join(root, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
pkg.contributes.configuration.properties["dsh.commitModel"].default = "flash";
fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");

console.log("commit model keyword + descriptions updated in", Object.keys(DESCRIPTIONS).length, "nls files");
