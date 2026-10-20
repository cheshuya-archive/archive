import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const { chromium } = createRequire(import.meta.url)('playwright');
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const base = process.env.CHESHUYA_PREVIEW_URL || 'http://127.0.0.1:3101';
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));

await page.goto(`${base}/index.html`);
assert.equal(await page.locator('#drawings h2').textContent(), 'Графика');
assert.equal(await page.locator('#objects .object-slide-button').first().getAttribute('data-object-index'), '0');
assert.match(await page.locator('#objects .object-slide-button').first().getAttribute('aria-label'), /металл/i);
assert.equal(await page.locator('#merch .section-heading a').getAttribute('href'), 'catalog-merch.html');
await page.locator('.archive-header button[aria-label="Открыть меню"]').click();
assert.equal(await page.getByRole('link', { name: 'Графика', exact: true }).count(), 1);
await page.keyboard.press('Escape');

await page.goto(`${base}/catalog-drawings.html`);
assert.equal(await page.locator('h1').textContent(), 'Графика');
assert.equal(await page.locator('.catalog-card').count(), 3);
const motion = await page.locator('.catalog-card').first().evaluate(card => {
  const image = card.querySelector('img');
  const before = getComputedStyle(image).transform;
  card.classList.add('test-hover');
  return { before, transition: getComputedStyle(image).transitionDuration };
});
assert.ok(motion.transition !== '0s');

await page.goto(`${base}/catalog-merch.html`);
assert.equal(await page.locator('.catalog-card').count(), 2);
assert.match(await page.locator('.catalog-card').first().innerText(), /180 г\/м²/);
for (const image of await page.locator('.catalog-card img').all()) {
  await image.scrollIntoViewIfNeeded();
  await assert.doesNotReject(async () => {
    await image.evaluate(img => img.decode());
  });
}
await page.evaluate(() => localStorage.setItem('cheshuya-locale', 'en'));
await page.reload();
await page.waitForFunction(() => document.querySelector('[data-merch-title]')?.textContent?.includes('Home T-shirt'));
assert.match(await page.locator('.catalog-card').first().innerText(), /100% cotton/);
await page.evaluate(() => localStorage.setItem('cheshuya-locale', 'ru'));

for (const material of ['metal', 'ceramic']) {
  await page.goto(`${base}/catalog-objects-${material}.html`);
  assert.equal(await page.locator('.catalog-card').count(), material === 'metal' ? 4 : 5);
  assert.match(await page.locator('.catalog-card').first().innerText(), /001/);
  await page.locator('.catalog-card').first().click();
  await page.waitForURL(new RegExp(`object\\.html\\?id=${material}-1`));
  await page.waitForFunction(() => document.querySelector('.zine-photo[data-active="true"]')?.naturalWidth > 0);
  assert.match(await page.locator('.object-description').textContent(), material === 'metal' ? /покрытие по дереву/ : /2021/);
  const count = material === 'metal' ? 3 : 2;
  assert.equal(await page.locator('.zine-slide img').count(), count);
  await page.locator('.zine-controls .next').click();
  await page.waitForFunction(() => document.querySelector('.counter')?.textContent?.startsWith('2 /'));
}

await page.evaluate(() => localStorage.setItem('cheshuya-locale', 'en'));
await page.goto(`${base}/object.html?id=metal-2`);
await page.waitForFunction(() => document.querySelector('.zine-info h1')?.textContent?.includes('Untitled'));
assert.match(await page.locator('.object-description').textContent(), /metal coating on wood/);
await page.evaluate(() => localStorage.setItem('cheshuya-locale', 'ru'));

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${base}/object.html?id=ceramic-1`);
await page.waitForFunction(() => document.querySelector('.zine-photo[data-active="true"]')?.naturalWidth > 0);
const dimensions = await page.evaluate(() => ({ screen: innerWidth, page: document.documentElement.scrollWidth }));
assert.ok(dimensions.page <= dimensions.screen + 1, JSON.stringify(dimensions));
assert.deepEqual(errors, []);
await browser.close();
console.log('Current catalogs, images, object carousels, and mobile layout: OK');
