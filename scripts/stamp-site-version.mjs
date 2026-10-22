import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const revision = process.env.GITHUB_SHA?.slice(0, 7) || execFileSync('git', ['rev-parse', '--short=7', 'HEAD'], {
  cwd: root,
  encoding: 'utf8',
}).trim();
if (!/^[a-f0-9]{7}$/.test(revision)) throw new Error('Invalid Git revision for site_version');
writeFileSync(new URL('../dist/site-version.js', import.meta.url),
  `window.CHESHUYA_SITE_VERSION = ${JSON.stringify(revision)};\n`);
console.log(`site_version: ${revision}`);
