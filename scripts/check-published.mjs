import assert from "node:assert/strict";
const [owner, repository] = (process.env.GITHUB_REPOSITORY || "").split("/");
const fallback = owner && repository
  ? `https://${owner}.github.io/${repository.toLowerCase() === `${owner.toLowerCase()}.github.io` ? "" : `${repository}/`}`
  : "https://xamidulline.github.io/cheshuya/";
const base = new URL(process.env.PUBLISHED_SITE || fallback);
const revision = process.env.GITHUB_SHA || Date.now().toString();
async function get(path) {
  const url = new URL(path,base);
  url.searchParams.set("release",revision);
  const response = await fetch(url,{signal:AbortSignal.timeout(20000)});
  assert.equal(response.status,200,"Published resource "+url+" returned "+response.status);
  return response.text();
}
let home;
for (let attempt=0;attempt<10;attempt++) {
  try {
    home = await get("index.html");
    assert.ok(home.includes('src="analytics.js"'),"Waiting for analytics release");
    const version = await get("site-version.js");
    if (process.env.GITHUB_SHA) {
      assert.ok(version.includes(process.env.GITHUB_SHA.slice(0, 7)),"Waiting for current release");
    }
    break;
  } catch (error) {
    if (attempt===9) throw error;
    await new Promise(done=>setTimeout(done,5000));
  }
}
const assets = new Set(["site-localization.js","site-translations.js","photo-lightbox.js","photo-zoom.js","gallery-viewer.js","photo-expand.js","gallery-ui.css","site-theme.css","home-layout-preview.css","analytics.js","analytics.css","site-version.js","fonts/IBMPlexMono-Regular.woff2"]);
const routes = ["index.html","catalog-prints.html","catalog-exhibitions.html","catalog-objects.html","catalog-objects-ceramic.html","catalog-objects-metal.html","catalog-drawings.html","catalog-merch.html","merch-dom-white.html","merch-dom-black.html","cyanotype.html","zine-nedostatochno-pamyati.html","zine-ubezhishche.html","zine-sloi.html","drawing.html?surface=paper","object.html?id=ceramic-1","exhibition.html?id=polya-prisutstviya","privacy.html"];
for (const path of routes) {
  const html = path==="index.html" ? home : await get(path);
  if (path!=="privacy.html") assert.ok(html.includes("site-localization.js"),"Missing localization on "+path);
  assert.ok(html.includes('src="analytics.js"'),"Missing analytics consent layer on "+path);
  if (path==="merch-dom-white.html" || path==="merch-dom-black.html") assert.ok(html.includes('data-spec-label="color"'),"Missing T-shirt colour on "+path);
  if (path==="object.html?id=ceramic-1") assert.ok(html.includes('data-object-spec-label="size"'),"Missing object specifications");
  for (const match of html.matchAll(/<(?:script|link)[^>]+(?:src|href)="([^"]+)"/g)) {
    if (!/^(https?:|data:)/.test(match[1])) assets.add(match[1]);
  }
  const image = html.match(/<img[^>]+src="([^"]+)"/);
  if (image) assets.add(image[1]);
}
await Promise.all([...assets].map(async path => {
  const url = new URL(path,base);
  url.searchParams.set("release",revision);
  const response = await fetch(url,{method:"HEAD",signal:AbortSignal.timeout(20000)});
  assert.equal(response.status,200,"Published asset "+url+" returned "+response.status);
}));
console.log("PASS published GitHub Pages:",routes.length,"routes and",assets.size,"shared resources",base.href);
