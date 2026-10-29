import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import sharp from "sharp";

const sourceRoot = "public/images";
async function filesIn(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesIn(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}
const originals = (await filesIn(sourceRoot)).filter(file => file.endsWith("-1200.webp"));
let count = 0, bytes = 0;
for (const file of originals) {
  // Only derived images are re-encoded. Existing 600/1200/2000 files stay untouched.
  const variants = file.includes("cyanotypes") ? [192, 400, 800] : [400, 800];
  for (const width of variants) {
    const input = width <= 400 ? file.replace("-1200.webp", "-600.webp") : file;
    const destination = file.replace("-1200.webp", "-"+width+".webp");
    let current = false;
    try { current = (await stat(destination)).mtimeMs >= (await stat(input)).mtimeMs; } catch {}
    if (!current) await sharp(input).resize({ width, withoutEnlargement: true })
      .webp({ quality: width === 192 ? 78 : 82 }).toFile(destination);
    const output = join("dist/images", relative(sourceRoot, destination));
    await mkdir(dirname(output), { recursive: true });
    await copyFile(destination, output);
    count++;
    bytes += (await stat(destination)).size;
  }
}
console.log("Prepared", count, "derived images per site:", bytes, "bytes. Original artwork files preserved.");

// Use the already-generated small files instead of downloading a 600/1200px
// photograph for every compact card on high-density screens.
for (const page of (await readdir("dist")).filter(file => file.endsWith(".html"))) {
  const file = join("dist", page);
  const html = await readFile(file, "utf8");
  const optimized = html.replace(/<img\b[^>]*>/g, tag => tag.replace(/\s((?:data-)?srcset)="([^"]+)"/g, (attribute, name, value) => {
    const entries = value.split(",").map(entry => entry.trim());
    const base = entries.find(entry => /^images\/.*-600\.webp 600w$/.test(entry))?.replace(/-600\.webp 600w$/, "");
    if (!base || !entries.includes(`${base}-1200.webp 1200w`)) return attribute;
    const byWidth = new Map(entries.map(entry => [Number(entry.match(/\s(\d+)w$/)?.[1]), entry]));
    for (const width of [400, 800]) {
      if (!byWidth.has(width) && existsSync(join("dist", decodeURIComponent(`${base}-${width}.webp`)))) {
        byWidth.set(width, `${base}-${width}.webp ${width}w`);
      }
    }
    return ` ${name}="${[...byWidth].sort((a, b) => a[0] - b[0]).map(([, entry]) => entry).join(", ")}"`;
  }));
  if (optimized !== html) await writeFile(file, optimized);
}

await copyFile("lib/photo-lightbox.js", "dist/photo-lightbox.js");
await copyFile("public/gallery-ui.css", "dist/gallery-ui.css");

await copyFile("lib/photo-zoom.js", "dist/photo-zoom.js");

await copyFile("public/site-theme.css", "dist/site-theme.css");

await copyFile("lib/heading-typing.js", "dist/heading-typing.js");

await copyFile("lib/logo-particles.js", "dist/logo-particles.js");

await copyFile("lib/site-translations.js", "dist/site-translations.js");

await copyFile("lib/archive-path.js", "dist/archive-path.js");

await copyFile("lib/back-to-top.js", "dist/back-to-top.js");
