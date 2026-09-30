/**
 * 0.13.34:提交消息生成「恢复默认模型失败」时的可见告警文案(14 种语言)。
 */
import fs from "node:fs";
import path from "node:path";

const root = "D:/Workspace/vscode";

const KEYS = {
  "commit.modelRestoreFailed": {
    "zh-cn": "提交消息已生成,但默认模型未能恢复为 {model}。请在模型下拉里重新选择一次(宿主后台保存可能失败)。",
    "zh-tw": "提交訊息已產生,但預設模型未能還原為 {model}。請在模型下拉中重新選擇一次(主機背景儲存可能失敗)。",
    en: "The commit message was generated, but the default model could not be restored to {model}. Please pick it again in the model dropdown (the host's background save may have failed).",
    ja: "コミットメッセージは生成されましたが、既定のモデルを {model} に戻せませんでした。モデル選択で選び直してください(ホストのバックグラウンド保存が失敗した可能性があります)。",
    ko: "커밋 메시지는 생성되었지만 기본 모델을 {model}(으)로 되돌리지 못했습니다. 모델 선택에서 다시 선택해 주세요(호스트 백그라운드 저장이 실패했을 수 있습니다).",
    de: "Die Commit-Nachricht wurde erstellt, aber das Standardmodell konnte nicht auf {model} zurückgesetzt werden. Bitte wählen Sie es erneut im Modellmenü (das Speichern im Hintergrund ist möglicherweise fehlgeschlagen).",
    fr: "Le message de commit a été généré, mais le modèle par défaut n'a pas pu être rétabli sur {model}. Veuillez le resélectionner dans la liste des modèles (l'enregistrement en arrière-plan a peut-être échoué).",
    es: "El mensaje de commit se generó, pero no se pudo restaurar el modelo predeterminado a {model}. Vuelve a elegirlo en la lista de modelos (puede que el guardado en segundo plano haya fallado).",
    pt: "A mensagem de commit foi gerada, mas o modelo padrão não pôde ser restaurado para {model}. Selecione-o novamente na lista de modelos (o salvamento em segundo plano pode ter falhado).",
    th: "สร้างข้อความคอมมิตแล้ว แต่ไม่สามารถคืนค่าโมเดลเริ่มต้นเป็น {model} ได้ โปรดเลือกใหม่ในรายการโมเดล (การบันทึกเบื้องหลังของโฮสต์อาจล้มเหลว)",
    id: "Pesan commit berhasil dibuat, tetapi model bawaan tidak dapat dikembalikan ke {model}. Pilih lagi di daftar model (penyimpanan latar belakang host mungkin gagal).",
    tr: "Commit mesajı oluşturuldu ancak varsayılan model {model} olarak geri alınamadı. Lütfen model listesinden yeniden seçin (arka planda kaydetme başarısız olmuş olabilir).",
    ru: "Сообщение коммита создано, но модель по умолчанию не удалось вернуть на {model}. Выберите её снова в списке моделей (фоновая запись могла не удаться).",
    ar: "تم إنشاء رسالة الالتزام، لكن تعذّر إرجاع الطراز الافتراضي إلى {model}. يرجى اختياره مرة أخرى من قائمة الطرازات (قد تكون الكتابة في الخلفية قد فشلت).",
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
