import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { createRequire } from "node:module";
const { chromium, webkit } = createRequire(import.meta.url)("playwright");
const root = resolve("dist");
const types = { ".html":"text/html", ".js":"text/javascript", ".css":"text/css", ".svg":"image/svg+xml", ".webp":"image/webp", ".woff2":"font/woff2" };
const server = createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const file = resolve(root, "." + path + (path.endsWith("/") ? "index.html" : ""));
    if (!file.startsWith(root + sep)) throw Error("path");
    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream" });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(done => server.listen(0, "127.0.0.1", done));
const origin = "http://127.0.0.1:" + server.address().port;
const errors = [];
try {
  for (const [name, engine] of [["chromium", chromium], ["webkit", webkit]]) {
    const browser = await engine.launch();
    try {
      for (const colorScheme of ["light", "dark"]) {
        const context = await browser.newContext({ viewport: { width:390, height:844 }, isMobile:true, hasTouch:true, colorScheme });
        const page = await context.newPage();
        page.on("pageerror", error => errors.push(name + ": " + error.message));
        await page.goto(origin + "/index.html");
        const image = page.locator(".logo-stage img");
        // First touch, while the optional controller has not loaded yet.
        const rect = await image.boundingBox();
        await page.touchscreen.tap(rect.x + rect.width / 2, rect.y + rect.height / 2);
        await page.locator(".logo-hit-area").waitFor({ state:"visible" });
        assert.equal(await image.getAttribute("data-logo-input"), "pointer");
        assert.equal(await image.evaluate(image => getComputedStyle(image).outlineStyle), "none");
        assert.equal(await image.evaluate(image => getComputedStyle(image).webkitTapHighlightColor), "rgba(0, 0, 0, 0)");
        // Keyboard focus must remain visible, including on the animated layer.
        await page.keyboard.press("Tab");
        await page.keyboard.press("Shift+Tab");
        for (let i = 0; i < 20 && !await image.evaluate(image => image === document.activeElement); i++) await page.keyboard.press("Tab");
        assert.equal(await image.evaluate(image => image === document.activeElement), true);
        assert.equal(await image.getAttribute("data-logo-input"), "keyboard");
        assert.equal(await image.evaluate(image => getComputedStyle(image).outlineWidth), "2px");
        await page.keyboard.down("Space");
        await page.waitForFunction(() => document.querySelector(".logo-particles-layer svg"));
        await page.waitForFunction(() => getComputedStyle(document.querySelector(".logo-particles-layer")).outlineWidth === "2px");
        await page.keyboard.up("Space");
        // A pointer hold after keyboard use must not inherit its focus ring.
        await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
        await page.mouse.down();
        await page.waitForTimeout(250);
        assert.equal(await image.getAttribute("data-logo-input"), "pointer");
        assert.equal(await image.evaluate(image => getComputedStyle(image).outlineStyle), "none");
        assert.equal(await page.locator(".logo-particles-layer").evaluate(layer => getComputedStyle(layer).outlineStyle), "none");
        await page.mouse.up();
        await page.touchscreen.tap(rect.x + rect.width / 2, rect.y + rect.height / 2);
        assert.equal(await image.evaluate(image => getComputedStyle(image).outlineStyle), "none");
        assert.equal(await page.locator(".logo-particles-layer").evaluate(layer => getComputedStyle(layer).outlineStyle), "none");
        await page.waitForFunction(() => {
          const svg = document.querySelector(".logo-particles-layer svg");
          return svg && !svg.style.transform && [...svg.querySelectorAll("path")].every(path => !path.style.transform);
        });
        assert.equal(await page.locator(".logo-particles-layer").evaluate(layer => getComputedStyle(layer).outlineStyle), "none");
        // Switching back to the keyboard restores the ring without reloading.
        await page.keyboard.press("Tab");
        await page.keyboard.press("Shift+Tab");
        for (let i = 0; i < 20 && !await image.evaluate(image => image === document.activeElement); i++) await page.keyboard.press("Tab");
        await page.waitForFunction(() => getComputedStyle(document.querySelector(".logo-particles-layer")).outlineWidth === "2px");
        assert.equal(await image.evaluate(image => getComputedStyle(image).outlineWidth), "2px");
        console.log("PASS logo focus: initial touch, pointer hold after keyboard, touch after hold, keyboard ring restored", name, colorScheme);
        await context.close();
      }
    } finally { await browser.close(); }
  }
  assert.deepEqual(errors, []);
} finally {
  await new Promise(done => server.close(done));
}
