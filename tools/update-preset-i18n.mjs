/**
 * 内置 Agent 预设文案更新(DSH 0.2.0:code → ptc,四段文案同步宿主词典)。
 * 12 个非中英语言词典补齐新键。
 */
import fs from "node:fs";
import path from "node:path";

const root = "D:/Workspace/vscode";

const KEYS = {
  "处理代码、文件和资料,适合大多数任务。Agent 会按需使用检索、编辑和终端等工具。": {
    "zh-tw": "處理程式碼、檔案與資料,適合大多數任務。Agent 會視需要運用檢索、編輯與終端工具。",
    ja: "コード・ファイル・資料を扱う、ほとんどのタスクに適したモード。Agent は検索・編集・ターミナルなどのツールを必要に応じて使います。",
    ko: "코드, 파일, 자료를 다루며 대부분의 작업에 적합합니다. Agent는 필요에 따라 검색, 편집, 터미널 도구를 사용합니다.",
    de: "Für Code, Dateien und Dokumente geeignet – für die meisten Aufgaben. Der Agent nutzt Such-, Bearbeitungs- und Terminal-Werkzeuge nach Bedarf.",
    fr: "Pour le code, les fichiers et les documents ; convient à la plupart des tâches. L'agent utilise les outils de recherche, d'édition et de terminal selon les besoins.",
    es: "Para código, archivos y documentos; sirve para la mayoría de tareas. El agente usa herramientas de búsqueda, edición y terminal según haga falta.",
    pt: "Para código, arquivos e documentos; serve para a maioria das tarefas. O agente usa ferramentas de busca, edição e terminal conforme necessário.",
    th: "เหมาะกับงานส่วนใหญ่ที่เกี่ยวกับโค้ด ไฟล์ และเอกสาร Agent จะใช้เครื่องมือค้นหา แก้ไข และเทอร์มินัลตามความจำเป็น",
    id: "Untuk kode, berkas, dan dokumen; cocok untuk sebagian besar tugas. Agen memakai alat pencarian, penyuntingan, dan terminal sesuai kebutuhan.",
    tr: "Kod, dosya ve belgeler üzerinde çalışır; çoğu göreve uygundur. Ajan arama, düzenleme ve terminal araçlarını gerektiğinde kullanır.",
    ru: "Для кода, файлов и документов; подходит для большинства задач. Агент по необходимости использует поиск, редактирование и терминал.",
    ar: "للتعامل مع الشيفرة والملفات والمستندات، ويناسب معظم المهام. يستخدم الوكيل أدوات البحث والتحرير والطرفية حسب الحاجة.",
  },
  "PTC 模式": {
    "zh-tw": "PTC 模式", ja: "PTC モード", ko: "PTC 모드", de: "PTC-Modus", fr: "Mode PTC", es: "Modo PTC",
    pt: "Modo PTC", th: "โหมด PTC", id: "Mode PTC", tr: "PTC modu", ru: "Режим PTC", ar: "وضع PTC",
  },
  "包含标准模式的所有能力,更适合批量调用工具,并对结果进行筛选、整理、去重、统计或汇总的任务。": {
    "zh-tw": "包含標準模式的所有能力,更適合批量呼叫工具,並對結果進行篩選、整理、去重、統計或彙總的任務。",
    ja: "標準モードの全機能を含み、ツールをまとめて呼び出し、その結果を絞り込み・整理・重複排除・集計・要約するタスクに適しています。",
    ko: "표준 모드의 모든 기능을 포함하며, 도구를 일괄 호출한 뒤 결과를 필터링·정리·중복 제거·집계·요약하는 작업에 더 적합합니다.",
    de: "Enthält alle Funktionen des Standardmodus und eignet sich besser für Aufgaben, die Werkzeuge gebündelt aufrufen und Ergebnisse filtern, ordnen, entdoppeln, zählen oder zusammenfassen.",
    fr: "Inclut toutes les capacités du mode Standard ; mieux adapté aux tâches qui appellent des outils par lots puis filtrent, organisent, dédupliquent, comptent ou résument les résultats.",
    es: "Incluye todas las capacidades del modo Estándar; es más adecuado para tareas que llaman a herramientas por lotes y luego filtran, organizan, deduplican, cuentan o resumen resultados.",
    pt: "Inclui todos os recursos do modo Padrão; é mais adequado a tarefas que chamam ferramentas em lote e depois filtram, organizam, deduplicam, contam ou resumem os resultados.",
    th: "มีความสามารถทั้งหมดของโหมดมาตรฐาน และเหมาะกับงานที่เรียกเครื่องมือเป็นชุดแล้วกรอง จัดระเบียบ ตัดรายการซ้ำ นับ หรือสรุปผลลัพธ์",
    id: "Mencakup semua kemampuan mode Standar; lebih cocok untuk tugas yang memanggil alat secara berkelompok lalu menyaring, merapikan, menghapus duplikat, menghitung, atau merangkum hasil.",
    tr: "Standart modun tüm yeteneklerini içerir; araçları toplu çağırıp sonuçları filtreleyen, düzenleyen, tekilleştiren, sayan veya özetleyen görevlere daha uygundur.",
    ru: "Включает все возможности стандартного режима; лучше подходит для задач, где инструменты вызываются пакетно, а результаты нужно отфильтровать, упорядочить, дедуплицировать, посчитать или обобщить.",
    ar: "يتضمن كل قدرات الوضع القياسي، وهو أنسب للمهام التي تستدعي الأدوات دفعةً واحدة ثم ت filtrer النتائج أو ترتبها أو تزيل تكرارها أو تحصيها أو تلخصها.",
  },
  "Agent 仅使用终端工具完成任务,适合测试和对比其基础表现。": {
    "zh-tw": "Agent 僅使用終端工具完成任務,適合測試與對比其基礎表現。",
    ja: "Agent はターミナルツールのみでタスクを完了します。基本性能のテストや比較に適しています。",
    ko: "Agent가 터미널 도구만으로 작업을 완료합니다. 기본 성능을 테스트하고 비교하기에 적합합니다.",
    de: "Der Agent erledigt Aufgaben nur mit einem Terminal-Werkzeug; ideal zum Testen und Vergleichen der Grundleistung.",
    fr: "L'agent accomplit les tâches avec le seul outil terminal ; utile pour tester et comparer ses performances de base.",
    es: "El agente realiza las tareas solo con la herramienta de terminal; útil para probar y comparar su rendimiento básico.",
    pt: "O agente conclui tarefas apenas com a ferramenta de terminal; útil para testar e comparar seu desempenho básico.",
    th: "Agent ทำงานให้เสร็จโดยใช้เฉพาะเครื่องมือเทอร์มินัล เหมาะสำหรับทดสอบและเปรียบเทียบประสิทธิภาพพื้นฐาน",
    id: "Agen menyelesaikan tugas hanya dengan alat terminal; berguna untuk menguji dan membandingkan performa dasarnya.",
    tr: "Ajan görevleri yalnızca terminal aracıyla tamamlar; temel performansını test etmek ve karşılaştırmak için uygundur.",
    ru: "Агент выполняет задачи только инструментом терминала; удобно для проверки и сравнения базовой производительности.",
    ar: "ينجز الوكيل المهام باستخدام أداة الطرفية فقط؛ ومناسب لاختبار أدائه الأساسي ومقارنته.",
  },
  "用对话定制 DSH:让 Agent 编写插件,添加新功能或界面;也能组合工具和提示词,创建自己的模式。": {
    "zh-tw": "用對話客製 DSH:讓 Agent 撰寫外掛,加入新功能或介面;也能組合工具與提示詞,建立自己的模式。",
    ja: "会話で DSH をカスタマイズ:Agent にプラグインを書かせて機能や UI を追加でき、ツールとプロンプトを組み合わせて独自モードも作れます。",
    ko: "대화로 DSH를 맞춤 설정하세요. Agent가 플러그인을 작성해 기능이나 UI를 추가하고, 도구와 프롬프트를 조합해 나만의 모드를 만들 수 있습니다.",
    de: "DSH per Dialog anpassen: Der Agent schreibt Plugins für neue Funktionen oder UI und kombiniert Werkzeuge und Prompts zu eigenen Modi.",
    fr: "Personnalisez DSH par la conversation : l'agent écrit des plugins pour ajouter des fonctions ou une interface, et combine outils et prompts en modes personnalisés.",
    es: "Personaliza DSH conversando: el agente escribe plugins para añadir funciones o interfaz, y combina herramientas y prompts en modos propios.",
    pt: "Personalize o DSH por conversa: o agente escreve plugins para adicionar recursos ou interface, e combina ferramentas e prompts em modos próprios.",
    th: "ปรับแต่ง DSH ด้วยบทสนทนา: ให้ Agent เขียนปลั๊กอินเพิ่มฟีเจอร์หรือ UI และ組合เครื่องมือกับพรอมป์ต์เป็นโหมดของคุณเอง",
    id: "Sesuaikan DSH lewat percakapan: minta agen menulis plugin untuk menambah fitur atau UI, serta menggabungkan alat dan prompt menjadi mode Anda sendiri.",
    tr: "DSH'yi sohbetle özelleştirin: ajan eklenti yazarak özellik veya arayüz ekler, araçları ve istemleri birleştirip kendi modunuzu oluşturur.",
    ru: "Настраивайте DSH в диалоге: агент пишет плагины, добавляя функции или интерфейс, и собирает инструменты с промптами в собственные режимы.",
    ar: "خصّص DSH عبر المحادثة: يكتب الوكيل إضافات لإضافة ميزات أو واجهة، ويمكنه دمج الأدوات والتوجيهات لإنشاء أوضاع خاصة بك.",
  },
};

let updated = 0;
const dir = path.join(root, "src/webview/texts");
for (const file of fs.readdirSync(dir)) {
  if (!file.endsWith(".json")) continue;
  const lang = file.replace(/\.json$/, "");
  const full = path.join(dir, file);
  const dict = JSON.parse(fs.readFileSync(full, "utf8"));
  let changed = false;
  for (const [key, byLang] of Object.entries(KEYS)) {
    if (dict[key] === undefined && byLang[lang] !== undefined) {
      dict[key] = byLang[lang];
      changed = true;
    }
  }
  // 旧文案键(已随 0.2.0 更新)从词典移除,避免残留过期翻译
  for (const stale of [
    "功能完整的编码 Agent,支持文件编辑、Shell、文件与网页检索、Skills、计划、目标、子代理和工作流。",
    "具备标准模式的全部能力,并通过 Code Mode SDK 呈现工具,让模型用一个 TypeScript 程序组合多步操作。",
    "仅提供持久 bash 与 str_replace_editor 的双工具编码 Agent。",
    "用于创建自定义 Agent preset:具备标准模式的全部能力,并提供运行时检查、插件实验和 preset 创作指导。",
    "编码模式",
  ]) {
    if (dict[stale] !== undefined) {
      delete dict[stale];
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(full, `${JSON.stringify(dict, null, 2)}\n`, "utf8");
    updated++;
  }
}
console.log(`webview dictionaries updated: ${updated}`);
