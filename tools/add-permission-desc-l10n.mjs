/**
 * 权限可选项目的中文说明(与网页端词典一致)。
 * 之前扩展内联了中文并只做 EN 映射,其他语言会退化成英文;这里统一进宿主 l10n 包。
 */
import fs from "node:fs";
import path from "node:path";

const root = "D:/Workspace/vscode";

const KEYS = {
  "perm.desc.readOnly": {
    "zh-cn": "只读访问:不能修改文件或执行命令;外部文件与网络访问按策略询问",
    "zh-tw": "唯讀存取:不能修改檔案或執行命令;外部檔案與網路存取依策略詢問",
    en: "Read-only access: no file changes or command execution; outside files and network access follow the approval policy.",
    ja: "読み取り専用:ファイル変更やコマンド実行はできません。外部ファイルとネットワークは承認ポリシーに従います。",
    ko: "읽기 전용: 파일 수정이나 명령 실행이 불가하며, 외부 파일과 네트워크는 승인 정책을 따릅니다.",
    de: "Nur-Lesen: keine Dateiänderungen oder Befehlsausführung; externe Dateien und Netzwerk folgen der Genehmigungsrichtlinie.",
    fr: "Lecture seule : aucune modification de fichier ni exécution de commande ; les fichiers externes et le réseau suivent la politique d'approbation.",
    es: "Solo lectura: sin cambios en archivos ni ejecución de comandos; los archivos externos y la red siguen la política de aprobación.",
    pt: "Somente leitura: sem alterações de arquivos ou execução de comandos; arquivos externos e rede seguem a política de aprovação.",
    th: "อ่านอย่างเดียว: แก้ไขไฟล์หรือรันคำสั่งไม่ได้ ไฟล์ภายนอกและเครือข่ายเป็นไปตามนโยบายอนุมัติ",
    id: "Hanya baca: tidak ada perubahan berkas atau eksekusi perintah; berkas luar dan jaringan mengikuti kebijakan persetujuan.",
    tr: "Salt okunur: dosya değişikliği veya komut çalıştırma yok; dış dosyalar ve ağ, onay ilkesine tabidir.",
    ru: "Только чтение: без изменения файлов и запуска команд; внешние файлы и сеть — по политике подтверждений.",
    ar: "وصول للقراءة فقط: لا تعديل للملفات ولا تنفيذ أوامر، والملفات الخارجية والشبكة وفق سياسة الموافقة.",
  },
  "perm.desc.workspaceWrite": {
    "zh-cn": "可修改工作区内的文件;外部文件与网络访问按策略询问",
    "zh-tw": "可修改工作區內的檔案;外部檔案與網路存取依策略詢問",
    en: "Can modify files inside the workspace; outside files and network access follow the approval policy.",
    ja: "ワークスペース内のファイルを変更できます。外部ファイルとネットワークは承認ポリシーに従います。",
    ko: "작업 영역 내 파일을 수정할 수 있으며, 외부 파일과 네트워크는 승인 정책을 따릅니다.",
    de: "Darf Dateien im Arbeitsbereich ändern; externe Dateien und Netzwerk folgen der Genehmigungsrichtlinie.",
    fr: "Peut modifier les fichiers de l'espace de travail ; les fichiers externes et le réseau suivent la politique d'approbation.",
    es: "Puede modificar archivos dentro del espacio de trabajo; los archivos externos y la red siguen la política de aprobación.",
    pt: "Pode modificar arquivos dentro do espaço de trabalho; arquivos externos e rede seguem a política de aprovação.",
    th: "แก้ไขไฟล์ในเวิร์กสเปซได้ ส่วนไฟล์ภายนอกและเครือข่ายเป็นไปตามนโยบายอนุมัติ",
    id: "Dapat mengubah berkas di dalam ruang kerja; berkas luar dan jaringan mengikuti kebijakan persetujuan.",
    tr: "Çalışma alanı içindeki dosyaları değiştirebilir; dış dosyalar ve ağ, onay ilkesine tabidir.",
    ru: "Может изменять файлы внутри рабочей области; внешние файлы и сеть — по политике подтверждений.",
    ar: "يمكنه تعديل الملفات داخل مساحة العمل، أما الملفات الخارجية والشبكة فوفق سياسة الموافقة.",
  },
  "perm.desc.dangerFullAccess": {
    "zh-cn": "可不受限制地访问互联网和你电脑上的任何文件",
    "zh-tw": "可不受限制地存取網際網路和你電腦上的任何檔案",
    en: "Unrestricted access to the internet and any file on your computer.",
    ja: "インターネットと PC 上のあらゆるファイルに無制限にアクセスできます。",
    ko: "인터넷과 컴퓨터의 모든 파일에 제한 없이 접근합니다.",
    de: "Uneingeschränkter Zugriff auf das Internet und jede Datei auf Ihrem Computer.",
    fr: "Accès illimité à Internet et à n'importe quel fichier de votre ordinateur.",
    es: "Acceso sin restricciones a Internet y a cualquier archivo de tu equipo.",
    pt: "Acesso irrestrito à internet e a qualquer arquivo do seu computador.",
    th: "เข้าถึงอินเทอร์เน็ตและไฟล์ใดก็ได้ในเครื่องโดยไม่มีข้อจำกัด",
    id: "Akses tanpa batas ke internet dan berkas apa pun di komputer Anda.",
    tr: "İnternete ve bilgisayarınızdaki her dosyaya sınırsız erişim.",
    ru: "Неограниченный доступ к интернету и любым файлам на вашем компьютере.",
    ar: "وصول غير مقيّد إلى الإنترنت وإلى أي ملف على جهازك.",
  },
  "perm.desc.custom": {
    "zh-cn": "自定义组合(在设置中编辑)",
    "zh-tw": "自訂組合(在設定中編輯)",
    en: "Custom combination (edit it in Settings).",
    ja: "カスタムの組み合わせ(設定で編集できます)。",
    ko: "사용자 지정 조합(설정에서 편집).",
    de: "Eigene Kombination (in den Einstellungen bearbeiten).",
    fr: "Combinaison personnalisée (à modifier dans les paramètres).",
    es: "Combinación personalizada (edítala en Ajustes).",
    pt: "Combinação personalizada (edite nas Configurações).",
    th: "การผสมแบบกำหนดเอง (แก้ไขได้ในการตั้งค่า)",
    id: "Kombinasi kustom (edit di Pengaturan).",
    tr: "Özel bileşim (Ayarlar'dan düzenleyin).",
    ru: "Собственная комбинация (изменяется в настройках).",
    ar: "تركيبة مخصّصة (عدّلها في الإعدادات).",
  },
};

let updated = 0;
for (const file of fs.readdirSync(path.join(root, "l10n"))) {
  if (!/^bundle\.l10n(\..*)?\.json$/.test(file)) continue;
  const lang = file === "bundle.l10n.json" ? "en" : file.replace(/^bundle\.l10n\./, "").replace(/\.json$/, "");
  const full = path.join(root, "l10n", file);
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
console.log(`l10n bundles updated: ${updated}`);
