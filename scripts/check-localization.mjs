import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, readdir } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium, webkit } = require("playwright");
const root = resolve("dist");
const types = {".html":"text/html",".js":"text/javascript",".css":"text/css",".svg":"image/svg+xml",".webp":"image/webp",".woff2":"font/woff2"};
const server = createServer(async (req,res) => {
  try {
    const name = decodeURIComponent(new URL(req.url,"http://localhost").pathname);
    const file = resolve(root,"."+name+(name.endsWith("/")?"index.html":""));
    if (!file.startsWith(root+sep)) throw Error("path");
    const body = await readFile(file);
    res.writeHead(200,{"Content-Type":types[extname(file)]||"application/octet-stream"}); res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(done => server.listen(0,"127.0.0.1",done));
const origin = "http://127.0.0.1:"+server.address().port;
const pages = (await readdir(root)).filter(p=>p.endsWith(".html")&&!["drawing.html","object.html","exhibition.html"].includes(p));
pages.push(...["paper","canvas","wood"].map(surface=>"drawing.html?surface="+surface));
pages.push(...["metal-1","metal-4","ceramic-1","ceramic-5"].map(id=>"object.html?id="+id));
pages.push(...["polya-prisutstviya","uyazvimoe-mesto","portal","black-show","rusty-box","sleepy-stupor","deep-woods-cold-winters","rekviem-po-zhek-artu"].map(id=>"exhibition.html?id="+id));
const cyrillic = value => /[А-Яа-яЁё]/.test(value.replaceAll("Чешуя",""));
try {
  for (const [name, engine] of [["chromium",chromium],["webkit",webkit]]) {
    const browser = await engine.launch();
    const context = await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true,isMobile:true,reducedMotion:"reduce"});
    await context.addInitScript(()=>{ try { localStorage.setItem("cheshuya-locale","en"); } catch {} });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror",error=>errors.push(error.message));
    for (const path of pages) {
      const requests = [];
      const record = request=>requests.push(request.url());
      page.on("request",record);
      await page.goto(origin+"/"+path,{waitUntil:"networkidle"});
      await page.waitForFunction(()=>document.documentElement.lang==="en");
      assert.equal(cyrillic(await page.locator("main").innerText()),false,"Untranslated page "+path+": "+await page.locator("main").innerText());
      const labels = await page.locator("main [aria-label]").evaluateAll(nodes=>nodes.map(node=>node.getAttribute("aria-label")));
      assert.deepEqual(labels.filter(cyrillic),[],"Untranslated controls "+path);
      assert.equal(requests.some(url=>/\/photo-(lightbox|zoom)\.js/.test(url)),false,"Viewer loaded before use: "+path);
      for (const width of [320,390,768,1440]) {
        await page.setViewportSize({width,height:844});
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),"Overflow "+path+" at "+width);
      }
      await page.setViewportSize({width:390,height:844});
      const generatedLabels = await page.locator(".zine-pagination>a,.cyanotype-back").evaluateAll(nodes=>nodes.flatMap(node=>["::before","::after"].map(pseudo=>getComputedStyle(node,pseudo).content)));
      assert.deepEqual(generatedLabels.filter(cyrillic),[],"Untranslated CSS labels "+path);
      const burger = page.locator(".header-controls button:last-child,.catalog-burger,.zine-burger");
      await burger.click();
      const menu = page.locator("#site-menu");
      assert.equal(cyrillic(await menu.innerText()),false,"Untranslated menu "+path);
      assert.equal(await menu.locator("[data-target]").count(),6);
      await page.locator(".language-button").click();
      await page.waitForFunction(()=>document.documentElement.lang==="ru");
      assert.match(await menu.innerText(),/Работа в среде/);
      await page.locator(".language-button").click();
      await page.keyboard.press("Escape");
      await page.waitForFunction(()=>!document.querySelector("main").inert);
      if (await page.locator(".gallery-zoom").count()) {
        await page.locator(".gallery-zoom").first().click();
        await page.waitForFunction(()=>document.querySelector(".photo-lightbox")?.open);
        const dialog = page.locator(".photo-lightbox");
        const dialogLabels = await dialog.locator("[aria-label]").evaluateAll(nodes=>nodes.map(node=>node.getAttribute("aria-label")));
        assert.deepEqual(dialogLabels.filter(cyrillic),[],"Untranslated viewer "+path);
        const altText = await dialog.locator("img").evaluateAll(nodes=>nodes.map(node=>node.alt));
        assert.deepEqual(altText.filter(cyrillic),[],"Untranslated image descriptions "+path);
        await page.waitForFunction(()=>document.querySelector(".lightbox-stage img[data-active=true]")?.naturalWidth>0);
        await page.locator(".photo-zoom-toggle").click();
        assert.equal(await page.locator(".photo-zoom-toggle").getAttribute("aria-label"),"Reset zoom");
        await page.keyboard.press("Escape");
        await page.waitForFunction(()=>!document.querySelector(".photo-lightbox"));
        assert.equal(await page.locator(".gallery-zoom").first().evaluate(node=>node===document.activeElement),true);
      }
      if (path==="index.html") {
        assert.equal(await page.locator("[data-path-prefix]").textContent(),"cheshuya\\archive\\");
        assert.equal(await page.locator(".section-heading .catalog-link svg[aria-hidden=true]").count(),5,"Catalog arrows survive locale changes");
        await page.locator("#inside-tab").click();
        assert.equal(cyrillic(await page.locator("main").innerText()),false,"Untranslated material tab");
        await page.locator("#outside-tab").click();
      }
      page.off("request",record);
      console.log("PASS",name,"locale round trip, menu, zoom and responsive layout",path);
    }
    await page.goto(origin+"/index.html");
    await page.locator(".header-controls button:last-child").click();
    await page.locator('[data-target="drawings"]').click();
    await page.waitForURL("**/catalog-drawings.html");
    assert.equal(await page.locator("html").getAttribute("lang"),"en","Locale lost during navigation");
    assert.equal(await page.locator(".catalog-header .theme-toggle").count(),0,"Inner header stays unchanged");
    assert.equal(await page.locator("#site-menu .menu-preferences .theme-toggle").count(),1,"Theme switch is available in the menu");
    await page.emulateMedia({colorScheme:"dark"});
    await page.waitForFunction(()=>document.documentElement.dataset.theme==="dark");
    assert.equal(await page.locator("html").getAttribute("data-theme"),"dark");
    assert.deepEqual(errors,[]);
    await context.close(); await browser.close();
  }
} finally { await new Promise(done=>server.close(done)); }
