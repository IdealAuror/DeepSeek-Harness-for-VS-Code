/** 版本号同步(package.json + README 双语)。用法:node tools/bump-version.mjs 0.13.16 */
import fs from "node:fs";

const next = process.argv[2];
if (!/^\d+\.\d+\.\d+$/.test(next ?? "")) throw new Error("用法:node tools/bump-version.mjs <x.y.z>");

const manifest = JSON.parse(fs.readFileSync("package.json", "utf8"));
const previous = manifest.version;
manifest.version = next;
fs.writeFileSync("package.json", `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

const readme = fs.readFileSync("README.md", "utf8");
fs.writeFileSync("README.md", readme.split(`Latest: ${previous}`).join(`Latest: ${next}`).split(`最新版本:${previous}`).join(`最新版本:${next}`), "utf8");

console.log(`${previous} -> ${next}`);
