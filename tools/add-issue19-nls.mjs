/**
 * issue #19 宿主侧新增文案:hub.agentError(回合内失败 → 错误提示)。
 * 13 个 bundle.l10n.*.json 缺该键时按插在 hub.sendFailed 之后补上。
 */
import fs from "node:fs";
import path from "node:path";

const root = "D:/Workspace/vscode";
const ANCHOR = "hub.sendFailed";
const KEY = "hub.agentError";

const VALUES = {
  en: "This turn failed: {message}",
  "zh-cn": "本回合失败: {message}",
  "zh-tw": "本回合失敗: {message}",
  ja: "このターンは失敗しました: {message}",
  ko: "이번 턴이 실패했습니다: {message}",
  de: "Dieser Turn ist fehlgeschlagen: {message}",
  fr: "Ce tour a échoué : {message}",
  es: "Este turno falló: {message}",
  pt: "Este turno falhou: {message}",
  th: "รอบนี้ล้มเหลว: {message}",
  id: "Turn ini gagal: {message}",
  tr: "Bu tur başarısız oldu: {message}",
  ru: "Этот ход завершился ошибкой: {message}",
  ar: "فشل هذا الدور: {message}",
};

const dir = path.join(root, "l10n");
let updated = 0;
for (const file of fs.readdirSync(dir)) {
  if (!file.startsWith("bundle.l10n") || !file.endsWith(".json")) continue;
  const lang = file.replace(/^bundle\.l10n\.?/, "").replace(/\.json$/, "") || "en";
  const value = VALUES[lang];
  if (value === undefined) continue;
  const full = path.join(dir, file);
  const raw = fs.readFileSync(full, "utf8");
  if (raw.includes(`"${KEY}"`)) continue;
  const lines = raw.replace(/\r\n/g, "\n").replace(/\n+$/, "").split("\n");
  const anchorIdx = lines.findIndex((line) => line.trimStart().startsWith(`"${ANCHOR}"`));
  if (anchorIdx < 0) throw new Error(`${file}: anchor ${ANCHOR} not found`);
  lines[anchorIdx] = `${lines[anchorIdx].replace(/,\s*$/, "")},`;
  lines.splice(anchorIdx + 1, 0, `  ${JSON.stringify(KEY)}: ${JSON.stringify(value)},`);
  fs.writeFileSync(full, `${lines.join("\n")}\n`, "utf8");
  updated++;
}
console.log(`l10n bundles updated: ${updated}`);
