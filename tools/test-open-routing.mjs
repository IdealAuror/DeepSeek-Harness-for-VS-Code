/**
 * 附件打开路由的单元测试:isTextLikePath 决定「文本编辑器 vs VS Code 默认查看器」。
 * 用官方构建产物(out/extension.js 不存在,故直接对源码做最小抽取)验证扩展名判定。
 * 运行:node tools/test-open-routing.mjs
 */
import { readFileSync } from "node:fs";

const src = readFileSync("src/webview/channel.ts", "utf8");
const block = /const BINARY_EXTENSIONS = new Set\(\[([\s\S]*?)\]\);/.exec(src);
const fn = /function isTextLikePath\(path: string\): boolean \{([\s\S]*?)\n\}/.exec(src);
if (!block || !fn) {
  console.error("未能从 src/webview/channel.ts 抽取 BINARY_EXTENSIONS / isTextLikePath");
  process.exit(2);
}
const make = new Function(`const BINARY_EXTENSIONS = new Set([${block[1]}]);\nfunction isTextLikePath(path) {${fn[1]}}\nreturn isTextLikePath;`);
const isTextLikePath = make();

const cases = [
  // 文本 → 编辑器 / git diff 路径
  ["src/app.ts", true],
  ["esbuild.mjs", true],
  ["README.md", true],
  ["Dockerfile", true],
  [".gitignore", true],
  ["package.json", true],
  ["noext", true],
  ["Makefile", true],
  // 二进制 / 媒体 → vscode.open 默认查看器
  ["C:\\proj\\logo.png", false],
  ["shot.JPEG", false],
  ["anim.gif", false],
  ["photo.webp", false],
  ["doc.pdf", false],
  ["archive.zip", false],
  ["build.exe", false],
  ["sound.mp3", false],
  ["video.mp4", false],
  ["font.woff2", false],
  ["data.sqlite", false],
  ["lib.dll", false],
];

let failures = 0;
for (const [path, expectText] of cases) {
  const actual = isTextLikePath(path);
  const ok = actual === expectText;
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${path.padEnd(22)} → ${actual ? "文本(编辑器/diff)" : "二进制(默认查看器)"}`);
}
console.log(`\n结果: ${failures === 0 ? "全部符合预期" : `${failures} 项不符`}`);
process.exit(failures === 0 ? 0 : 1);
