/**
 * 0.2.0 异步问答(限时提问)新增文案的本地化补齐。
 * 中文为源键:Webview 词典(src/webview/texts/*.json)补 12 语言 + EN_TEXT 由 ui.ts 承载。
 */
import fs from "node:fs";
import path from "node:path";

const root = "D:/Workspace/vscode";

const KEYS = {
  "{seconds}s 后继续": {
    "zh-tw": "{seconds}s 後繼續", ja: "{seconds} 秒後に続行", ko: "{seconds}초 후 계속", de: "Weiter in {seconds}s",
    fr: "Reprise dans {seconds} s", es: "Continúa en {seconds} s", pt: "Continua em {seconds} s", th: "ทำงานต่อใน {seconds} วิ",
    id: "Lanjut dalam {seconds}d", tr: "{seconds} sn sonra devam", ru: "Продолжит через {seconds} с", ar: "المتابعة بعد {seconds} ث",
  },
  "等待已结束 · 可稍后回答": {
    "zh-tw": "等待已結束 · 可稍後回答", ja: "待機終了 · 後から回答できます", ko: "대기 종료 · 나중에 답변 가능",
    de: "Wartezeit beendet · später beantwortbar", fr: "Attente terminée · réponse possible plus tard",
    es: "Espera finalizada · puedes responder después", pt: "Espera encerrada · responda depois",
    th: "สิ้นสุดการรอ · ตอบภายหลังได้", id: "Waktu tunggu berakhir · bisa dijawab nanti",
    tr: "Bekleme bitti · sonra yanıtlanabilir", ru: "Ожидание завершено · можно ответить позже",
    ar: "انتهت مدة الانتظار · يمكن الإجابة لاحقًا",
  },
  "等待已到期,Agent 已继续工作;你的回答会作为后续消息送达": {
    "zh-tw": "等待已到期,Agent 已繼續工作;你的回答會作為後續訊息送達",
    ja: "待機が期限切れになり、Agent は作業を続行しました。回答は後続メッセージとして届きます。",
    ko: "대기가 만료되어 Agent가 계속 작업했습니다. 답변은 후속 메시지로 전달됩니다.",
    de: "Die Wartezeit ist abgelaufen, der Agent arbeitet weiter; Ihre Antwort wird als Folgenachricht zugestellt.",
    fr: "L'attente a expiré, l'agent a poursuivi son travail ; votre réponse sera transmise comme message ultérieur.",
    es: "La espera expiró y el agente continuó trabajando; tu respuesta se entregará como mensaje posterior.",
    pt: "A espera expirou e o agente continuou trabalhando; sua resposta será entregue como mensagem posterior.",
    th: "หมดเวลารอแล้ว Agent ทำงานต่อ ระบบจะส่งคำตอบของคุณเป็นข้อความภายหลัง",
    id: "Waktu tunggu habis dan agen melanjutkan pekerjaan; jawaban Anda dikirim sebagai pesan lanjutan.",
    tr: "Bekleme süresi doldu ve ajan çalışmaya devam etti; yanıtınız sonraki ileti olarak iletilir.",
    ru: "Ожидание истекло, агент продолжил работу; ваш ответ будет доставлен отдельным сообщением.",
    ar: "انتهت مدة الانتظار وواصل الوكيل العمل؛ وسيصل ردّك كرسالة لاحقة.",
  },
  "限时提问:等待到期后 Agent 会先继续工作,你仍可稍后回答": {
    "zh-tw": "限時提問:等待到期後 Agent 會先繼續工作,你仍可稍後回答",
    ja: "時間制限付きの質問:期限が来ると Agent は先に作業を続け、後からでも回答できます。",
    ko: "시간 제한 질문: 대기가 만료되면 Agent가 먼저 작업을 계속하며, 나중에 답변할 수 있습니다.",
    de: "Zeitlich begrenzte Frage: Nach Ablauf arbeitet der Agent weiter, Sie können später antworten.",
    fr: "Question à durée limitée : à l'expiration, l'agent continue et vous pouvez répondre plus tard.",
    es: "Pregunta con tiempo limitado: al expirar, el agente continúa y puedes responder más tarde.",
    pt: "Pergunta com tempo limitado: ao expirar, o agente continua e você pode responder depois.",
    th: "คำถามจำกัดเวลา: เมื่อหมดเวลา Agent จะทำงานต่อ คุณยังตอบภายหลังได้",
    id: "Pertanyaan berbatas waktu: setelah habis, agen melanjutkan dan Anda tetap bisa menjawab nanti.",
    tr: "Süreli soru: süre dolduğunda ajan devam eder, sonra da yanıtlayabilirsiniz.",
    ru: "Вопрос с ограничением по времени: по истечении агент продолжит работу, ответить можно позже.",
    ar: "سؤال محدود بوقت: عند انتهاء المدة يواصل الوكيل العمل ويمكنك الإجابة لاحقًا.",
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
  if (changed) {
    fs.writeFileSync(full, `${JSON.stringify(dict, null, 2)}\n`, "utf8");
    updated++;
  }
}
console.log(`webview dictionaries updated: ${updated}`);
