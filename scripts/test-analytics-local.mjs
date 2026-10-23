// Run against an already-open local Chrome DevTools endpoint and serve-local.mjs.
// Vendor URLs are blocked by DevTools, so the test sends no analytics traffic.
import assert from 'node:assert/strict';

const endpoint = process.env.CHESHUYA_CDP || 'http://127.0.0.1:9223';
const site = process.env.CHESHUYA_TEST_SITE || 'http://127.0.0.1:3104';
const pages = await fetch(`${endpoint}/json`).then(response => response.json());
const pageTarget = pages.find(page => page.type === 'page' && page.webSocketDebuggerUrl);
if (!pageTarget) throw new Error('No Chrome page target available for local analytics test');
const socket = new WebSocket(pageTarget.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});
let id = 0;
const pending = new Map();
socket.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  message.error ? reject(new Error(JSON.stringify(message.error))) : resolve(message.result);
});
const cdp = (method, params = {}) => new Promise((resolve, reject) => {
  const next = ++id;
  pending.set(next, { resolve, reject });
  socket.send(JSON.stringify({ id: next, method, params }));
});
const evaluate = async expression => {
  const result = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
};
const waitFor = async predicate => {
  for (let attempt = 0; attempt < 80; attempt++) {
    if (await evaluate(predicate)) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out: ${predicate}`);
};
const navigate = async path => {
  await cdp('Page.navigate', { url: site + path });
  await waitFor('document.readyState === "complete" && !!window.CheshuyaAnalytics');
};
const state = () => evaluate('window.CheshuyaAnalytics.getState()');
const vendorScripts = () => evaluate(`[...document.scripts].filter(s=>/googletagmanager|clarity\\.ms|cloudflareinsights/.test(s.src)).map(s=>s.src)`);
const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);

try {
  await cdp('Page.enable');
  await cdp('Runtime.enable');
  await cdp('Network.enable');
  await cdp('Network.setBlockedURLs', {
    urls: ['*googletagmanager.com*', '*google-analytics.com*', '*clarity.ms*', '*cloudflareinsights.com*'],
  });

  await navigate('/index.html');
  await evaluate('localStorage.removeItem("cheshuya-analytics-consent-v1");localStorage.removeItem("cheshuya-analytics-preview-v1")');
  await cdp('Page.reload', { ignoreCache: true });
  await waitFor('document.readyState === "complete" && !!window.CheshuyaAnalytics');
  assert.equal((await state()).consent, null);
  assert.deepEqual(await vendorScripts(), []);
  assert.equal(await evaluate('!!document.querySelector(".analytics-consent")'), false);
  await waitFor('!!document.querySelector(".analytics-consent.is-visible")');
  assert.equal(await evaluate('document.querySelector(".analytics-consent-header p")?.textContent'), 'Разрешить Чешуе использовать аналитику?');
  assert.equal(await evaluate('document.querySelector(".analytics-consent-header img")?.getAttribute("src")'), 'media/cheshuya-figma-logo.svg');
  assert.equal(await evaluate('Math.abs(document.querySelector(".analytics-actions").getBoundingClientRect().left-document.querySelector(".analytics-consent").getBoundingClientRect().left)<40'), true);
  assert.equal(await evaluate('Math.abs(document.querySelector(".analytics-consent-bottom>a").getBoundingClientRect().right-document.querySelector(".analytics-consent").getBoundingClientRect().right)<40'), true);
  await click('.analytics-banner .analytics-action:not(.analytics-primary)');
  assert.equal((await state()).consent, 'denied');
  assert.deepEqual(await vendorScripts(), []);
  assert.equal(await evaluate('document.querySelector(".analytics-consent")?.classList.contains("is-leaving")'), true);

  await navigate('/zine-sloi.html');
  assert.equal((await state()).consent, 'denied');
  assert.deepEqual(await vendorScripts(), []);
  assert.equal(await evaluate('!!document.querySelector("footer .analytics-settings-link")'), false);
  await click('footer .analytics-footer-privacy a');
  await waitFor('location.pathname.endsWith("privacy.html") && !!document.querySelector(".analytics-settings-link")');
  await click('.analytics-settings-link');
  await click('.analytics-settings .analytics-primary');
  assert.equal((await state()).consent, 'granted');
  assert.equal((await vendorScripts()).length, 3);
  assert.equal(await evaluate('[...document.scripts].some(script => script.src.endsWith("/z1s34rbr10"))'), true);
  assert.equal(await evaluate('window.clarity.q.some(args=>args[0]==="consentv2"&&args[1].analytics_Storage==="granted"&&args[1].ad_Storage==="denied")'), true);
  assert.equal(await evaluate('document.querySelector("script[src*=cloudflareinsights]")?.type'), 'module');
  assert.equal(await evaluate('JSON.parse(document.querySelector("script[src*=cloudflareinsights]").dataset.cfBeacon).token'), 'ed4b042d40ec46debdb07d1da629b625');
  await navigate('/zine-sloi.html');
  await waitFor('window.dataLayer?.some(x=>x[0]==="event"&&x[1]==="gallery_open")');
  const events = await evaluate('window.dataLayer.filter(x=>x[0]==="event").map(x=>x[1])');
  for (const name of ['page_view', 'section_view', 'project_open', 'gallery_open']) {
    assert.equal(events.filter(event => event === name).length, 1, `${name} should fire once`);
  }
  await evaluate(`(() => {
    const stage=document.querySelector('.zine-slide');
    const total=stage.querySelectorAll('img').length;
    for(let index=0;index<total;index++) {
      const detail={stage,index,total};
      document.dispatchEvent(new CustomEvent('cheshuya:gallery-change',{detail}));
      document.dispatchEvent(new CustomEvent('cheshuya:gallery-change',{detail}));
    }
  })()`);
  assert.equal(await evaluate('window.dataLayer.filter(x=>x[0]==="event"&&x[1]==="gallery_open").length'), 1);
  assert.deepEqual(await evaluate('window.dataLayer.filter(x=>x[0]==="event"&&x[1]==="gallery_progress").map(x=>x[2].progress_percent)'), [25,50,75,100]);
  await waitFor('!!document.querySelector(".gallery-zoom")');
  await click('.gallery-zoom');
  await waitFor('!!document.querySelector(".photo-lightbox[open]")');
  assert.equal(await evaluate('window.dataLayer.filter(x=>x[0]==="event"&&x[1]==="image_expand").length'), 1);
  await click('.object-lightbox-close');
  assert.equal(await evaluate('window.dataLayer.filter(x=>x[0]==="event"&&x[1]==="gallery_open").length'), 1);

  await navigate('/index.html');
  await click('.static-tabs [data-tab="inside"]');
  await click('.static-tabs [data-tab="inside"]');
  assert.equal(await evaluate('window.dataLayer.filter(x=>x[0]==="event"&&x[1]==="tab_open").length'), 1);
  await navigate('/index.html?preview=1');
  assert.equal((await state()).vendorsStarted, false);
  assert.deepEqual(await vendorScripts(), []);
  assert.equal(await evaluate('!!document.querySelector(".analytics-preview-prompt")'), true);
  await click('.analytics-preview-prompt .analytics-primary');
  assert.equal((await state()).preview, true);
  await navigate('/zine-sloi.html');
  assert.equal((await state()).preview, true);
  assert.deepEqual(await vendorScripts(), []);
  await navigate('/privacy.html');
  await click('.analytics-settings-link');
  await click('.analytics-settings .analytics-action');
  assert.equal((await state()).preview, false);
  assert.equal((await vendorScripts()).length, 3);

  await click('.analytics-settings-link');
  await click('.analytics-settings .analytics-action');
  await waitFor('window.CheshuyaAnalytics && window.CheshuyaAnalytics.getState().consent === "denied"');
  assert.deepEqual(await vendorScripts(), []);

  await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true, screenWidth: 390, screenHeight: 844 });
  await navigate('/index.html');
  const mobile = await evaluate(`(() => {
    const footer=document.querySelector('.analytics-footer,.archive-footer');
    return {width:innerWidth,footerRight:footer?.getBoundingClientRect().right,privacy:!!footer?.querySelector('.analytics-footer-privacy a'),settings:!!footer?.querySelector('.analytics-settings-link')};
  })()`);
  assert.equal(mobile.privacy, true);
  assert.equal(mobile.settings, false);
  assert.ok(mobile.footerRight <= mobile.width + 2);
  await evaluate('localStorage.removeItem("cheshuya-analytics-consent-v1")');
  await cdp('Page.reload', { ignoreCache: true });
  await waitFor('!!document.querySelector(".analytics-consent.is-visible")');
  await waitFor('document.querySelector(".analytics-consent").getBoundingClientRect().bottom <= innerHeight + 1');
  const mobileBanner = await evaluate(`(() => {
    const rect=document.querySelector('.analytics-consent').getBoundingClientRect();
    return {left:rect.left,right:rect.right,bottom:rect.bottom,width:innerWidth,height:innerHeight};
  })()`);
  assert.ok(mobileBanner.left >= 0 && mobileBanner.right <= mobileBanner.width + 1);
  assert.ok(mobileBanner.bottom <= mobileBanner.height + 1);
  console.log('PASS: delayed consent, slide-out, privacy settings, denial, opt-in, no duplicate core events, preview persistence, withdrawal, mobile layout');
} finally {
  socket.close();
}
