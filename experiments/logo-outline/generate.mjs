import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const sourceUrl = new URL('../../dist/media/cheshuya-figma-logo.svg', import.meta.url);
const outputUrls = [
  new URL('./cheshuya-figma-logo-outline.svg', import.meta.url),
  new URL('../../public/media/cheshuya-figma-logo-outline.svg', import.meta.url),
  new URL('../../dist/media/cheshuya-figma-logo-outline.svg', import.meta.url),
];
const source = await readFile(sourceUrl, 'utf8');
const pathCount = (source.match(/<path\b/g) || []).length;
const filledPathCount = (source.match(/fill="black"/g) || []).length;

if (!pathCount || pathCount !== filledPathCount) {
  throw new Error('The original logo changed; check its paths before generating a new outline.');
}

// Preserve every original path and the viewBox; change only how paths are painted.
const outline = source.replaceAll(
  'fill="black"',
  'fill="none" stroke="black" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"',
);

for (const outputUrl of outputUrls) {
  await writeFile(outputUrl, outline, 'utf8');
  console.log(`Created the outline variant from ${pathCount} original paths: ${fileURLToPath(outputUrl)}`);
}
