/**
 * 整理 CHANGELOG:把同一版本的零散块合并为一个标题(保留顺序),
 * 并把本会话的「权限说明本地化」条目并回 0.13.33 段内。
 */
import { readFileSync, writeFileSync } from "node:fs";
const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

for (const f of ["CHANGELOG.md", ".dsh/agent/extension-changelog.md"]) {
  const path = `${root}${f}`;
  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  const header = [];
  const blocks = new Map(); // version -> string[]
  const order = [];
  let current = null;
  for (const line of lines) {
    const m = /^## (\S+)/.exec(line);
    if (m) {
      current = m[1];
      if (!blocks.has(current)) {
        blocks.set(current, []);
        order.push(current);
      }
      continue;
    }
    if (current === null) header.push(line);
    else if (line.trim() !== "") blocks.get(current).push(line);
  }
  // 本会话的权限说明条目错插在 0.13.32;移回 0.13.33
  const stray = "Permission descriptions are now localized through the host l10n bundles";
  const strayZh = "权限说明改为通过宿主 l10n 包本地化";
  const mine = blocks.get("0.13.33") ?? [];
  for (const [version, body] of blocks) {
    const kept = body.filter((l) => !l.startsWith(`- ${stray}`) && !l.startsWith(`- ${strayZh}`));
    if (kept.length !== body.length) blocks.set(version, kept);
  }
  for (const [version, body] of blocks) {
    const moved = body.filter((l) => l.startsWith(`- ${stray}`) || l.startsWith(`- ${strayZh}`));
    if (moved.length) {
      blocks.set(version, body.filter((l) => !moved.includes(l)));
      mine.push(...moved);
    }
  }
  blocks.set("0.13.33", mine);

  const out = [...header];
  for (const version of order) {
    const body = blocks.get(version);
    if (!body || body.length === 0) continue;
    out.push(`## ${version}`, ...body, "");
  }
  writeFileSync(path, out.join("\n").replace(/\n{4,}/g, "\n\n\n").trimEnd() + "\n", "utf8");
  console.log(`${f}: 合并完成(版本块 ${order.length} 个)`);
}
