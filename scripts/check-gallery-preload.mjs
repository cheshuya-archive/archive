import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { createRequire } from "node:module";

const { chromium } = createRequire(import.meta.url)("playwright");
const root = resolve("dist");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".webp": "image/webp", ".png": "image/png", ".svg": "image/svg+xml" };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const file = resolve(root, pathname.replace(/^\/+/, "") || "index.html");
    if (!file.startsWith(root + sep)) throw new Error("Invalid path");
    const body = await readFile(file);
    response.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream" });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
});
await new Promise(done => server.listen(0, "127.0.0.1", done));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ channel: "chrome" });
const errors = [];

async function verify(viewport, slowNetwork = false) {
  const context = await browser.newContext({ viewport, isMobile: viewport.width < 700, hasTouch: viewport.width < 700 });
  const page = await context.newPage();
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => {
    window.__decoded = [];
    window.__lightboxChanges = [];
    document.addEventListener("cheshuya:lightbox-change", event => window.__lightboxChanges.push(event.detail.index));
    const original = HTMLImageElement.prototype.decode;
    HTMLImageElement.prototype.decode = function () {
      const source = this.dataset.gallerySrc || this.currentSrc || this.src;
      return original.call(this).then(() => {
        window.__decoded.push(source);
      });
    };
  });
  const requests = [];
  page.on("request", request => {
    if (request.url().includes("/images/new-site-assets/exhibitions/polya-prisutstviya/")) requests.push(request.url());
  });
  let cdp;
  if (slowNetwork) {
    cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false, latency: 180, downloadThroughput: 180 * 1024, uploadThroughput: 50 * 1024,
    });
  }
  try {
    await page.goto(`${origin}/exhibition.html?id=polya-prisutstviya`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.__decoded.some(source => /\/02-/.test(source)), null, { timeout: 30000 });
    assert.equal(await page.locator(".zine-slide img").count(), 30);
    assert.deepEqual(await page.locator(".zine-slide img").evaluateAll(images => images.map((image, index) => image.getAttribute("src") ? index + 1 : null).filter(Boolean)), [1, 2]);
    assert.equal(new Set(requests.map(url => url.match(/\/(\d\d)-\d+\.webp/)?.[1])).size, 2);
    const dimensions = await page.locator(".zine-slide").boundingBox();
    await page.locator(".zine-controls .next").click();
    await page.waitForFunction(() => window.__decoded.some(source => /\/03-/.test(source)), null, { timeout: 30000 });
    await page.waitForFunction(() => document.querySelector(".counter")?.textContent?.trim() === "2 / 30");
    assert.deepEqual(await page.locator(".zine-slide img").evaluateAll(images => images.map((image, index) => image.getAttribute("src") ? index + 1 : null).filter(Boolean)), [1, 2, 3]);
    await page.locator(".zine-controls .next").click();
    await page.waitForFunction(() => window.__decoded.some(source => /\/04-/.test(source)), null, { timeout: 30000 });
    await page.waitForFunction(() => document.querySelector(".counter")?.textContent?.trim() === "3 / 30");
    const beforeBack = requests.length;
    await page.locator(".zine-controls .prev").click();
    await page.waitForFunction(() => document.querySelector(".counter")?.textContent?.trim() === "2 / 30");
    assert.equal(requests.length, beforeBack, "Back navigation must reuse already fetched frames");
    assert.deepEqual(await page.locator(".zine-slide").boundingBox(), dimensions, "Gallery geometry must not change");
    await page.locator(".zine-slide img[data-active=true]").click();
    await page.waitForFunction(() => document.querySelector(".direct-photo-viewer[open]")?.querySelector(".direct-photo-image")?.naturalWidth > 0);
    await page.locator(".direct-photo-next").click();
    await page.waitForFunction(() => window.__lightboxChanges.includes(2), null, { timeout: 30000 });
    await page.locator(".direct-photo-prev").click();
    await page.waitForFunction(() => window.__lightboxChanges.at(-1) === 1, null, { timeout: 30000 });
    assert.ok(new Set(requests.map(url => url.match(/\/(\d\d)-\d+\.webp/)?.[1])).size <= 5, "Viewer must not fetch the full exhibition");
    await page.locator(".direct-photo-close").click();
    await page.waitForFunction(() => !document.querySelector(".direct-photo-viewer"));
    assert.deepEqual(errors, [], "No browser errors");
    console.log(`PASS ${viewport.width}px${slowNetwork ? " throttled" : ""}: one decoded frame ahead, 30 lazy frames, back navigation, viewer, stable layout`);
  } finally {
    await cdp?.detach();
    await context.close();
  }
}

async function verifyGalleryTypes(viewport) {
  const cases = [
    ["zine-sloi.html", "Зин"],
    ["cyanotype.html", "Цианотипия"],
    ["object.html?id=ceramic-1", "Объект"],
    ["drawing.html?surface=paper", "Графика"],
  ];
  const context = await browser.newContext({ viewport, isMobile: viewport.width < 700, hasTouch: viewport.width < 700 });
  try {
    for (const [path, label] of cases) {
      const page = await context.newPage();
      const pageErrors = [];
      page.on("pageerror", error => pageErrors.push(error.message));
      const imageRequests = [];
      page.on("request", request => {
        if (/\/images\/.*\.webp/.test(request.url())) imageRequests.push(request.url());
      });
      await page.goto(`${origin}/${path}`, { waitUntil: "domcontentloaded" });
      const stage = page.locator(".zine-slide").first();
      await page.waitForFunction(() => {
        const images = document.querySelector(".zine-slide")?.querySelectorAll("img") || [];
        return images.length > 1 && images[1].naturalWidth > 0;
      }, null, { timeout: 30000 });
      const count = await stage.locator("img").count();
      assert.ok(count >= 2, `${label} needs multiple images`);
      const loaded = await stage.locator("img").evaluateAll(images => images.map((image, index) => image.hasAttribute("src") ? index + 1 : null).filter(Boolean));
      assert.deepEqual(loaded, [1, 2], `${label} must initially load only two full-size frames`);
      const carousel = page.locator(".zine-carousel").first();
      await carousel.locator(".zine-controls .next").click();
      await page.waitForFunction(() => document.querySelector(".zine-carousel .counter")?.textContent?.trim().startsWith("2 /"));
      if (count > 2) {
        await page.waitForFunction(() => document.querySelector(".zine-slide img:nth-child(3)")?.naturalWidth > 0, null, { timeout: 30000 });
      }
      const beforeBack = imageRequests.length;
      await carousel.locator(".zine-controls .prev").click();
      await page.waitForFunction(() => document.querySelector(".zine-carousel .counter")?.textContent?.trim().startsWith("1 /"));
      assert.equal(imageRequests.length, beforeBack, `${label} backward navigation must reuse frames`);
      assert.deepEqual(pageErrors, [], `${label} has no browser errors`);
      console.log(`PASS ${viewport.width}px ${label}: one prepared frame, forward/back, no duplicate requests`);
      await page.close();
    }
  } finally {
    await context.close();
  }
}

async function verifyHomeRails(viewport) {
  const context = await browser.newContext({ viewport, isMobile: viewport.width < 700, hasTouch: viewport.width < 700 });
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  try {
    await page.goto(`${origin}/index.html#cyanotype`, { waitUntil: "domcontentloaded" });
    const rail = page.locator("#cyanotype .rail-scroll");
    await rail.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector("#cyanotype .rail-scroll img:nth-of-type(1)")?.naturalWidth > 0);
    await page.waitForFunction(() => [...document.querySelectorAll("#cyanotype .rail-scroll img")][1]?.naturalWidth > 0);
    const images = rail.locator("img");
    assert.equal(await images.count(), 7);
    await page.locator("#cyanotype .rail-next").click();
    await page.waitForFunction(() => document.querySelector("#cyanotype .rail-scroll")?.scrollLeft > 100);
    await page.locator("#cyanotype .rail-prev").click();
    await page.waitForFunction(() => document.querySelector("#cyanotype .rail-scroll")?.scrollLeft < 5);
    const merch = page.locator("#merch .merch-photo-track");
    await merch.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => [...document.querySelectorAll("#merch .merch-photo-track img")][1]?.naturalWidth > 0);
    await page.locator("#merch [data-merch-select=white]").evaluate(input => {
      input.checked = true;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.waitForFunction(() => document.querySelectorAll("#merch .merch-photo-track img").length === 2);
    await page.waitForFunction(() => [...document.querySelectorAll("#merch .merch-photo-track img")][1]?.naturalWidth > 0);
    assert.deepEqual(pageErrors, [], "Home rails have no browser errors");
    console.log(`PASS ${viewport.width}px home: cyanotype rail and both merch colours`);
  } finally {
    await context.close();
  }
}

try {
  await verify({ width: 1440, height: 900 });
  await verify({ width: 390, height: 844 }, true);
  await verifyGalleryTypes({ width: 1440, height: 900 });
  await verifyGalleryTypes({ width: 390, height: 844 });
  await verifyHomeRails({ width: 1440, height: 900 });
  await verifyHomeRails({ width: 390, height: 844 });
} finally {
  await browser.close();
  await new Promise(done => server.close(done));
}
