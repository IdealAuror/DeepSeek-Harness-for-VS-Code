/**
 * 会话被其他 DSH 实例占用(session/writer-held)时的新增宿主文案。
 * 中文为源键;英文包给出英文源串,其余 12 语言给译文。
 */
import fs from "node:fs";
import path from "node:path";

const root = "D:/Workspace/vscode";

const ZH = "当前会话已被其他正在运行的 DSH 实例占用(例如桌面端或另一个 dsh web),模型切换 / 重命名 / 发送消息都会被拒绝。请在 VS Code 里换一个会话,或退出另一个 DSH 实例后重试。";
const ZH_TW = "目前工作階段已被其他正在執行的 DSH 實例占用(例如桌面端或另一個 dsh web),切換模型 / 重新命名 / 傳送訊息都會被拒絕。請在 VS Code 中改用其他工作階段,或結束另一個 DSH 實例後重試。";
const EN =
  "This session is held by another running DSH instance (for example the desktop app or another dsh web), so switching the model, renaming, or sending a message is refused. Switch to another session in VS Code, or quit the other DSH instance and retry.";

const OTHERS = {
  ja: "このセッションは別の DSH インスタンス(デスクトップアプリや別の dsh web など)が使用中のため、モデル切替・名前変更・メッセージ送信は拒否されます。VS Code で別のセッションに切り替えるか、もう一方の DSH を終了して再試行してください。",
  ko: "이 세션은 다른 DSH 인스턴스(데스크톱 앱 또는 다른 dsh web)가 사용 중이라 모델 전환·이름 변경·메시지 전송이 거부됩니다. VS Code에서 다른 세션으로 전환하거나 다른 DSH 인스턴스를 종료한 뒤 다시 시도하세요.",
  de: "Diese Sitzung wird von einer anderen laufenden DSH-Instanz gehalten (z. B. Desktop-App oder ein weiteres dsh web); Modellwechsel, Umbenennen und Senden werden abgelehnt. Wechseln Sie in VS Code zu einer anderen Sitzung oder beenden Sie die andere DSH-Instanz und versuchen Sie es erneut.",
  fr: "Cette session est détenue par une autre instance DSH en cours d'exécution (application de bureau ou autre dsh web) : le changement de modèle, le renommage et l'envoi sont refusés. Passez à une autre session dans VS Code, ou quittez l'autre instance DSH puis réessayez.",
  es: "Otra instancia de DSH en ejecución (la app de escritorio u otro dsh web) está usando esta sesión, por lo que cambiar el modelo, renombrar o enviar mensajes se rechaza. Cambia a otra sesión en VS Code o cierra la otra instancia de DSH y reinténtalo.",
  pt: "Esta sessão está em uso por outra instância do DSH em execução (app de desktop ou outro dsh web), então trocar o modelo, renomear ou enviar mensagens é recusado. Troque para outra sessão no VS Code ou encerre a outra instância do DSH e tente novamente.",
  th: "เซสชันนี้ถูกใช้งานโดย DSH อีกอินสแตนซ์ที่กำลังรันอยู่ (เช่น แอปเดสก์ท็อปหรือ dsh web อีกตัว) การสลับโมเดล เปลี่ยนชื่อ หรือส่งข้อความจะถูกปฏิเสธ โปรดสลับไปเซสชันอื่นใน VS Code หรือปิด DSH อีกอินสแตนซ์แล้วลองใหม่",
  id: "Sesi ini dipegang oleh instans DSH lain yang sedang berjalan (misalnya aplikasi desktop atau dsh web lain), sehingga mengganti model, menamai ulang, atau mengirim pesan ditolak. Beralihlah ke sesi lain di VS Code, atau tutup instans DSH yang lain lalu coba lagi.",
  tr: "Bu oturum, çalışan başka bir DSH örneği (masaüstü uygulaması veya başka bir dsh web) tarafından tutuluyor; model değiştirme, yeniden adlandırma ve mesaj gönderme reddedilir. VS Code'da başka bir oturuma geçin veya diğer DSH örneğini kapatıp yeniden deneyin.",
  ru: "Эта сессия удерживается другим запущенным экземпляром DSH (например, настольным приложением или другим dsh web), поэтому смена модели, переименование и отправка сообщений отклоняются. Переключитесь на другую сессию в VS Code либо закройте другой экземпляр DSH и повторите.",
  ar: "هذه الجلسة مشغولة بنسخة DSH أخرى قيد التشغيل (مثل تطبيق سطح المكتب أو dsh web آخر)، لذا يُرفض تبديل الطراز أو إعادة التسمية أو إرسال الرسائل. بدّل إلى جلسة أخرى في VS Code، أو أغلق نسخة DSH الأخرى ثم أعد المحاولة.",
};

const key = "notice.sessionInUse";
let updated = 0;
for (const file of fs.readdirSync(path.join(root, "l10n"))) {
  if (!/^bundle\.l10n(\..*)?\.json$/.test(file)) continue;
  const lang = file === "bundle.l10n.json" ? "en" : file.replace(/^bundle\.l10n\./, "").replace(/\.json$/, "");
  const full = path.join(root, "l10n", file);
  const dict = JSON.parse(fs.readFileSync(full, "utf8"));
  if (dict[key] !== undefined) continue;
  const value = lang === "en" ? EN : lang === "zh-cn" ? ZH : lang === "zh-tw" ? ZH_TW : OTHERS[lang];
  if (value === undefined) continue;
  dict[key] = value;
  fs.writeFileSync(full, `${JSON.stringify(dict, null, 2)}\n`, "utf8");
  updated++;
}
console.log(`l10n bundles updated: ${updated}`);
