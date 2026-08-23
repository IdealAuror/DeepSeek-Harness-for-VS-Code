// 更新插件短描述(package.json + package.nls.* 14 语言)。
import { readFileSync, writeFileSync } from "node:fs";
const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

const DESCRIPTIONS = {
  en: "Use DeepSeek Harness directly in VS Code: secondary sidebar chat panel, @dsh built-in chat participant with @ file/session/agent mentions, multimodal image attachments, model/preset/permission/thinking controls, subagents, Cordis plugin approvals, and turn-level Git rollback (undo one turn, restore checkpoints).",
  "zh-cn": "在 VS Code 中直接使用 DeepSeek Harness:辅助侧栏聊天面板 + 内置聊天参与者 @dsh(支持 @ 文件/会话/智能体提及)+ 多模态图片附件 + 模型/预设/权限/思考深度切换 + 子代理 + Cordis 插件审批 + 回合级 Git 回退(撤销单回合改动、还原检查点)。",
  "zh-tw": "在 VS Code 中直接使用 DeepSeek Harness:輔助側欄聊天面板 + 內建聊天參與者 @dsh(支援 @ 檔案/工作階段/智慧體提及)+ 多模態圖片附件 + 模型/預設/權限/思考深度切換 + 子代理 + Cordis 外掛程式審批 + 回合級 Git 回退(撤銷單回合改動、還原檢查點)。",
  ja: "VS Code で DeepSeek Harness を直接利用:セカンダリサイドバーのチャットパネル、@dsh ビルトインチャット参加者(@ ファイル/セッション/エージェント参照対応)、マルチモーダル画像添付、モデル/プリセット/権限/思考深度の切り替え、サブエージェント、Cordis プラグイン承認、ターンレベルの Git ロールバック(ターンの変更を元に戻す、チェックポイント復元)。",
  ko: "VS Code에서 DeepSeek Harness를 직접 사용: 보조 사이드바 채팅 패널, @dsh 내장 채팅 참여자(@ 파일/세션/에이전트 멘션 지원), 멀티모달 이미지 첨부, 모델/프리셋/권한/사고 깊이 전환, 서브에이전트, Cordis 플러그인 승인, 턴 수준 Git 롤백(턴 변경 취소, 체크포인트 복원).",
  de: "DeepSeek Harness direkt in VS Code nutzen: Sekundär-Sidebar-Chat, integrierter @dsh Chat-Teilnehmer (@ Datei-/Session-/Agent-Erwähnungen), multimodale Bildanhänge, Modell/Preset/Berechtigung/Denktiefe, Subagenten, Cordis-Plugin-Genehmigungen und Turn-Level-Git-Rollback (Turn rückgängig machen, Checkpoints wiederherstellen).",
  fr: "Utilisez DeepSeek Harness directement dans VS Code : panneau de discussion de la barre latérale secondaire, participant de chat intégré @dsh (mentions @ fichier/session/agent), pièces jointes d'images multimodales, contrôles modèle/préréglage/permission/profondeur de réflexion, sous-agents, approbations de plugins Cordis et retour Git au niveau du tour (annuler un tour, restaurer des points de contrôle).",
  es: "Usa DeepSeek Harness directamente en VS Code: panel de chat de la barra lateral secundaria, participante de chat integrado @dsh (menciones @ archivo/sesión/agente), adjuntos de imágenes multimodales, controles de modelo/ajuste/permiso/profundidad de pensamiento, subagentes, aprobaciones de plugins Cordis y reversión Git a nivel de turno (deshacer un turno, restaurar puntos de control).",
  pt: "Use o DeepSeek Harness diretamente no VS Code: painel de chat da barra lateral secundária, participante de chat integrado @dsh (menções @ arquivo/sessão/agente), anexos de imagem multimodais, controles de modelo/predefinição/permissão/profundidade de raciocínio, subagentes, aprovações de plugins Cordis e reversão Git por turno (desfazer um turno, restaurar pontos de verificação).",
  th: "ใช้ DeepSeek Harness ใน VS Code ได้โดยตรง: แผงแชทแถบด้านข้างรอง, ผู้เข้าร่วมแชทในตัว @dsh (การอ้างอิง @ ไฟล์/เซสชัน/เอเจนต์), ไฟล์แนบรูปภาพมัลติมอดัล, การสลับโมเดล/พรีเซ็ต/สิทธิ์/ความลึกของการคิด, เอเจนต์ย่อย, การอนุมัติปลั๊กอิน Cordis และ Git ย้อนกลับระดับเทิร์น (เลิกทำเทิร์น, คืนค่าจุดตรวจสอบ)",
  id: "Gunakan DeepSeek Harness langsung di VS Code: panel obrolan bilah sisi sekunder, peserta obrolan bawaan @dsh (sebutan @ file/sesi/agen), lampiran gambar multimodal, kontrol model/preset/izin/kedalaman berpikir, subagen, persetujuan plugin Cordis, dan rollback Git tingkat giliran (urungkan giliran, pulihkan checkpoint).",
  tr: "DeepSeek Harness'ı doğrudan VS Code'da kullanın: ikincil kenar çubuğu sohbet paneli, yerleşik @dsh sohbet katılımcısı (@ dosya/oturum/ajan bahsetmeleri), çok modlu görsel ekleri, model/ön ayar/izin/düşünme derinliği kontrolleri, alt ajanlar, Cordis eklenti onayları ve turn düzeyinde Git geri alma (bir turu geri al, kontrol noktalarını geri yükle).",
  ar: "استخدم DeepSeek Harness مباشرة في VS Code: لوحة دردشة الشريط الجانبي الثانوي، مشارك الدردشة المدمج @dsh (إشارات @ ملف/جلسة/وكيل)، مرفقات الصور متعددة الوسائط، تبديل النموذج/الإعداد المسبق/الأذونات/عمق التفكير، الوكلاء الفرعيون، موافقات إضافة Cordis، وتراجع Git على مستوى الجولة (تراجع عن الجولة، استعادة نقاط التحقق).",
  ru: "Используйте DeepSeek Harness прямо в VS Code: панель чата на дополнительной боковой панели, встроенный участник чата @dsh (упоминания @ файл/сессия/агент), мультимодальные вложения изображений, переключатели модели/пресета/разрешений/глубины мышления, субагенты, одобрения плагинов Cordis и откат Git на уровне хода (отменить ход, восстановить контрольные точки).",
};

// package.json
const pkg = JSON.parse(readFileSync(`${root}package.json`, "utf8"));
pkg.description = DESCRIPTIONS.en;
writeFileSync(`${root}package.json`, JSON.stringify(pkg, null, 2) + "\n", "utf8");

// package.nls / package.nls.<lang>.json
const langs = ["en", "zh-cn", "zh-tw", "ja", "ko", "de", "fr", "es", "pt", "th", "id", "tr", "ar", "ru"];
let changed = 0;
for (const lang of langs) {
  const file = lang === "en" ? `${root}package.nls.json` : `${root}package.nls.${lang}.json`;
  let raw = readFileSync(file, "utf8");
  const bom = raw.charCodeAt(0) === 0xfeff;
  const obj = JSON.parse(bom ? raw.slice(1) : raw);
  obj["description"] = DESCRIPTIONS[lang] ?? DESCRIPTIONS.en;
  writeFileSync(file, (bom ? "\ufeff" : "") + JSON.stringify(obj, null, 2) + "\n", "utf8");
  changed++;
  console.log(`package.nls.${lang}: description updated`);
}
console.log(`done, ${changed + 1} files`);
