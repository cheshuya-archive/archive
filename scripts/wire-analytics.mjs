// Idempotent mechanical insertion into the static HTML published by GitHub Pages.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
for (const filename of readdirSync(dist).filter(name => name.endsWith('.html'))) {
  const path = new URL(`../dist/${filename}`, import.meta.url);
  const html = readFileSync(path, 'utf8');
  if (html.includes('src="analytics.js"')) continue;
  if (!html.includes('</head>')) throw new Error(`Missing </head> in ${filename}`);
  const addition = '<link rel="stylesheet" href="analytics.css"><script defer src="site-version.js"></script><script defer src="analytics.js"></script>';
  writeFileSync(path, html.replace('</head>', `${addition}</head>`));
  console.log(`Wired analytics: ${filename}`);
}
