import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, readdir, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const sourceDir = path.join(root, "images-source");
const outputDir = path.join(root, "public", "images");
const manifestPath = path.join(outputDir, ".image-manifest.json");
const staticDir = path.join(root, "dist");
const widths = [600, 1200, 2000];
const quality = Number(process.env.IMAGE_WEBP_QUALITY ?? 82);
const supportedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff", ".avif"]);

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return filesIn(entryPath);
    return entry.isFile() && supportedExtensions.has(path.extname(entry.name).toLowerCase()) ? [entryPath] : [];
  }));
  return files.flat();
}

async function sha256(file) {
  return createHash("sha256").update(await readFile(file)).digest("hex");
}

function variantPath(relativePath, width) {
  const parsed = path.parse(relativePath);
  return path.join(parsed.dir, `${parsed.name}-${width}.webp`);
}

async function loadManifest() {
  try {
    return JSON.parse(await readFile(manifestPath, "utf8"));
  } catch {
    return { version: 1, quality, assets: {} };
  }
}

async function variantsExist(relativePath) {
  return Promise.all(widths.map(async (width) => {
    try {
      await stat(path.join(outputDir, variantPath(relativePath, width)));
      return true;
    } catch {
      return false;
    }
  })).then((result) => result.every(Boolean));
}

async function copyDirectory(from, to) {
  await mkdir(to, { recursive: true });
  const entries = await readdir(from, { withFileTypes: true });
  await Promise.all(entries.map(async (entry) => {
    const fromPath = path.join(from, entry.name);
    const toPath = path.join(to, entry.name);
    if (entry.isDirectory()) return copyDirectory(fromPath, toPath);
    return copyFile(fromPath, toPath);
  }));
}

function staticSrcSet(source) {
  const parsed = path.posix.parse(decodeURIComponent(source.replace(/^media\//, "")));
  const encodedBase = encodeURI(path.posix.join(parsed.dir, parsed.name));
  return widths.map((width) => `images/${encodedBase}-${width}.webp ${width}w`).join(", ");
}

async function configureStaticPages() {
  try {
    await copyDirectory(outputDir, path.join(staticDir, "images"));
    const pages = (await readdir(staticDir)).filter((file) => file.endsWith(".html"));
    await Promise.all(pages.map(async (page) => {
      const pagePath = path.join(staticDir, page);
      let html = await readFile(pagePath, "utf8");
      html = html.replace(/<img([^>]*?)\s+src="(media\/[^"?]+)"([^>]*)>/g, (tag, before, source, after) => {
        if (!supportedExtensions.has(path.extname(decodeURIComponent(source)).toLowerCase())) return tag;
        const priority = /logo-stage|header-logo|street-feature/.test(before + after)
          || (page === "index.html" && source.includes("image%201"));
        const attributes = `${before}${after}`.replace(/\s(?:srcset|sizes|loading|fetchpriority)="[^"]*"/g, "");
        return `<img${attributes} src="${source}" srcset="${staticSrcSet(source)}" sizes="(max-width: 700px) 100vw, 600px" loading="${priority ? "eager" : "lazy"}"${priority ? ' fetchpriority="high"' : ""}>`;
      });
      if (!html.includes('responsive-images.js')) {
        html = html.replace("</head>", '<script src="responsive-images.js"></script></head>');
      }
      await writeFile(pagePath, html);
    }));
  } catch {
    // The Next.js project can be used without the legacy static preview folder.
  }
}

await mkdir(sourceDir, { recursive: true });
await mkdir(outputDir, { recursive: true });

const manifest = await loadManifest();
const sourceFiles = await filesIn(sourceDir);
let optimized = 0;
let skipped = 0;

for (const sourcePath of sourceFiles) {
  const relativePath = path.relative(sourceDir, sourcePath).split(path.sep).join("/");
  const hash = await sha256(sourcePath);
  const previous = manifest.assets[relativePath];

  if (previous?.hash === hash && previous.quality === quality && await variantsExist(relativePath)) {
    skipped += 1;
    continue;
  }

  const metadata = await sharp(sourcePath).metadata();
  if (!metadata.width) {
    console.warn(`Пропущен файл без ширины: ${relativePath}`);
    continue;
  }

  const outputs = [];
  for (const width of widths) {
    const outputRelativePath = variantPath(relativePath, width);
    const destination = path.join(outputDir, outputRelativePath);
    await mkdir(path.dirname(destination), { recursive: true });
    const temporary = `${destination}.tmp`;
    await sharp(sourcePath)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality })
      .toFile(temporary);
    await rename(temporary, destination);
    outputs.push({ width, file: outputRelativePath.split(path.sep).join("/") });
  }

  manifest.assets[relativePath] = { hash, quality, outputs };
  optimized += 1;
  console.log(`Готово: ${relativePath}`);
}

manifest.version = 1;
manifest.quality = quality;
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
await configureStaticPages();
console.log(`Оптимизация завершена: новых/изменённых — ${optimized}, без изменений — ${skipped}.`);
