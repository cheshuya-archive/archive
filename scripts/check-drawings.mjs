import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const { chromium } = createRequire(import.meta.url)('playwright');
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const origin = process.env.CHESHUYA_PREVIEW_URL || 'http://127.0.0.1:3101';

await page.goto(`${origin}/index.html#drawings`);
assert.equal(await page.locator('#drawings [data-drawing-category]').count(), 3);
await page.locator('#drawings [data-drawing-category="canvas"] a').click();
await page.waitForURL('**/drawing.html?surface=canvas');

await page.goto(`${origin}/catalog-drawings.html`);
assert.equal(await page.locator('.drawing-category-grid > a').count(), 3);
for (const surface of ['paper', 'canvas', 'wood']) {
  assert.equal(await page.locator(`a[href="drawing.html?surface=${surface}"]`).count(), 1);
}

for (const [surface, expected] of [['paper', 6], ['canvas', 2], ['wood', 2]]) {
  await page.goto(`${origin}/drawing.html?surface=${surface}`);
  await page.waitForFunction(() => document.querySelector('.zine-slide img[data-active="true"]')?.naturalWidth > 0);
  assert.equal(await page.locator('.drawing-series').count(), expected);
  assert.equal(await page.locator('.zine-carousel').count(), expected);
  assert.equal(await page.locator('.drawing-series .gallery-zoom').count(), expected);
  const stage = page.locator('.drawing-series').first().locator('.zine-slide');
  const initial = await stage.evaluate(element => element.scrollLeft);
  await page.locator('.drawing-series').first().locator('.next').click();
  await page.waitForFunction(() => document.querySelector('.drawing-series .zine-slide')?.scrollLeft > 10);
  assert.ok(await stage.evaluate(element => element.scrollLeft) > initial);
  await page.locator('.drawing-series').first().locator('.gallery-zoom').click();
  assert.equal(await page.locator('.object-lightbox[open]').count(), 1);
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(200);
  const geometry = await page.evaluate(() => {
    const carousel = document.querySelector('.drawing-series .zine-carousel').getBoundingClientRect();
    const next = document.querySelector('.drawing-series .next').getBoundingClientRect();
    return { viewport: innerWidth, page: document.documentElement.scrollWidth, carouselRight: carousel.right, nextRight: next.right };
  });
  assert.ok(geometry.page <= geometry.viewport + 1, JSON.stringify(geometry));
  assert.ok(geometry.nextRight <= geometry.carouselRight + 1, JSON.stringify(geometry));
  if (surface === 'canvas') await page.screenshot({ path: join(tmpdir(), 'cheshuya-drawings-mobile.png') });
  await page.setViewportSize({ width: 1280, height: 900 });
}
const touchContext = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const touchPage = await touchContext.newPage();
await touchPage.goto(`${origin}/drawing.html?surface=canvas`);
await touchPage.waitForFunction(() => document.querySelector('.zine-slide img[data-active="true"]')?.naturalWidth > 0);
const box = await touchPage.locator('.drawing-series .zine-slide').first().boundingBox();
const cdp = await touchContext.newCDPSession(touchPage);
const start = box.x + box.width * .8;
const end = box.x + box.width * .2;
const y = box.y + box.height / 2;
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: start, y }] });
for (let step = 1; step <= 12; step++) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: start + (end - start) * step / 12, y }] });
  await touchPage.waitForTimeout(25);
}
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
await touchPage.waitForTimeout(500);
await touchPage.waitForFunction(() => document.querySelector('.drawing-series .gallery-counter')?.textContent === '2 / 2', null, { timeout: 3000 });
await touchPage.goto(`${origin}/zine-nedostatochno-pamyati.html`);
await touchPage.waitForFunction(() => document.querySelector('.zine-slide img[data-active="true"]')?.naturalWidth > 0);
const zineBox = await touchPage.locator('.zine-slide').boundingBox();
const zineY = zineBox.y + zineBox.height / 2;
const zineStart = zineBox.x + zineBox.width * .8;
const zineEnd = zineBox.x + zineBox.width * .2;
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: zineStart, y: zineY }] });
for (let step = 1; step <= 12; step++) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: zineStart + (zineEnd - zineStart) * step / 12, y: zineY }] });
  await touchPage.waitForTimeout(25);
}
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
await touchPage.waitForFunction(() => document.querySelector('.zine-carousel .gallery-counter')?.textContent?.startsWith('2 /'), null, { timeout: 3000 });
await touchContext.close();
await page.evaluate(() => localStorage.setItem('cheshuya-locale', 'en'));
await page.goto(`${origin}/catalog-drawings.html`);
assert.equal(await page.locator('[data-drawing-category="paper"]').textContent(), 'On paper');
await page.goto(`${origin}/drawing.html?surface=canvas`);
assert.equal(await page.locator('#drawing-heading').textContent(), 'On canvas');
assert.equal(await page.locator('[data-series-title]').first().textContent(), 'Series 1');
assert.deepEqual(errors, []);
await browser.close();
console.log('Drawings catalog and 10 carousels: OK');
