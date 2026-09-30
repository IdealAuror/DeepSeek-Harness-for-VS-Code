/**
 * 0.13.36:头部发送快捷键按钮移除后的文案收敛。
 * - 删除仅头部菜单使用的 webview 键(发送快捷键 / 在设置中修改)及其 12 语言译文;
 * - 更新设置面板说明(不再提「头部 ⌨️ 按钮」)。
 * 只处理这几个键,不动其它内容。
 */
import fs from "node:fs";
import path from "node:path";

const root = "D:/Workspace/vscode";

/** 说明文案的旧/新(12 语言都要改,因为旧文案提到头部按钮)。 */
const HINT = {
  "zh-tw": "按 Enter 是傳送還是換行由此決定;輸入框左下角的膠囊也能一鍵切換,設定會全域儲存(dsh.sendKey)。",
  ja: "Enter が送信か改行かをここで決めます。入力欄左下のチップからも切り替えでき、設定は全体的に保存されます(dsh.sendKey)。",
  ko: "Enter가 전송인지 줄바꿈인지 여기서 결정합니다. 입력창 왼쪽 아래 칩으로도 전환할 수 있고 설정은 전역으로 저장됩니다(dsh.sendKey).",
  de: "Hier entscheidet sich, ob Enter sendet oder umbricht; auch der Chip unten links im Eingabefeld schaltet um. Die Einstellung wird global gespeichert (dsh.sendKey).",
  fr: "C'est ici que l'on choisit si Entrée envoie ou passe à la ligne ; la pastille en bas à gauche du champ permet aussi de basculer. Le réglage est enregistré globalement (dsh.sendKey).",
  es: "Aquí se decide si Enter envía o salta de línea; la píldora de la esquina inferior izquierda del cuadro también permite cambiarlo. El ajuste se guarda globalmente (dsh.sendKey).",
  pt: "Aqui se decide se Enter envia ou quebra linha; a pílula no canto inferior esquerdo do campo também alterna. A configuração é salva globalmente (dsh.sendKey).",
  th: "ที่นี่กำหนดว่า Enter จะส่งหรือขึ้นบรรทัดใหม่ ชิปมุมล่างซ้ายของช่องพิมพ์ก็สลับได้เช่นกัน และบันทึกเป็นการตั้งค่าทั่วไป (dsh.sendKey)",
  id: "Di sini ditentukan apakah Enter mengirim atau membuat baris baru; chip di kiri bawah kotak masukan juga bisa menggantinya. Pengaturan disimpan global (dsh.sendKey).",
  tr: "Enter'ın gönderip göndermeyeceği burada belirlenir; giriş kutusunun sol alt köşesindeki çip de değiştirir. Ayar genel olarak kaydedilir (dsh.sendKey).",
  ru: "Здесь решается, отправляет Enter сообщение или переносит строку; переключить можно также чипом в левом нижнем углу поля ввода. Настройка сохраняется глобально (dsh.sendKey).",
  ar: "هنا يُحدَّد ما إذا كان Enter يُرسل أو ينقل إلى سطر جديد؛ ويمكن التبديل أيضًا من الشريحة أسفل يسار حقل الإدخال. يُحفظ الإعداد عامًّا (dsh.sendKey).",
};

const OLD_HINT = "按 Enter 是发送还是换行由此决定;输入框左下角的胶囊与头部 ⌨️ 按钮也能一键切换,设置会全局保存(dsh.sendKey)。";
const NEW_HINT = "按 Enter 是发送还是换行由此决定;输入框左下角的胶囊也能一键切换,设置会全局保存(dsh.sendKey)。";
const DROP = ["发送快捷键", "在设置中修改"];

let dropped = 0;
let renamed = 0;
const textsDir = path.join(root, "src/webview/texts");
for (const file of fs.readdirSync(textsDir)) {
  if (!file.endsWith(".json")) continue;
  const lang = file.replace(/\.json$/, "");
  const full = path.join(textsDir, file);
  const dict = JSON.parse(fs.readFileSync(full, "utf8"));
  let changed = false;

  for (const key of DROP) {
    if (dict[key] !== undefined) {
      delete dict[key];
      dropped++;
      changed = true;
    }
  }
  if (dict[OLD_HINT] !== undefined) {
    delete dict[OLD_HINT];
    changed = true;
  }
  if (dict[NEW_HINT] === undefined && HINT[lang] !== undefined) {
    dict[NEW_HINT] = HINT[lang];
    renamed++;
    changed = true;
  }
  if (changed) fs.writeFileSync(full, `${JSON.stringify(dict, null, 2)}\n`, "utf8");
}
console.log(`dropped ${dropped} obsolete keys; updated hint in ${renamed} dictionaries`);
