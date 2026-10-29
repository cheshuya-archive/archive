(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const tabs = [...document.querySelectorAll('.static-tabs [data-tab]')];
  const panels = [...document.querySelectorAll('.tab-content')];
  const timers = new WeakMap();
  const select = (tab, userInitiated = false) => {
    const next = document.getElementById(tab.dataset.tab);
    if (!next) return;
    const changed = next.hidden;
    tabs.forEach(item => {
      const active = item === tab;
      item.classList.toggle('active', active);
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
    });
    panels.forEach(panel => { panel.hidden = panel !== next; });
    if (changed && userInitiated) {
      document.dispatchEvent(new CustomEvent('cheshuya:tab-open', { detail: { tabId: tab.dataset.tab } }));
    }
    if (changed && !reduced.matches) {
      clearTimeout(timers.get(next));
      next.classList.remove('tab-enter-left', 'tab-enter-right');
      void next.offsetWidth;
      next.classList.add(tab.dataset.tab === 'inside' ? 'tab-enter-right' : 'tab-enter-left');
      timers.set(next, setTimeout(() => next.classList.remove('tab-enter-left', 'tab-enter-right'), 360));
    }
  };
  tabs.forEach((tab,index) => {
    tab.addEventListener('pointerdown', event => { if (event.button === 0) select(tab, true); });
    tab.addEventListener('click', () => select(tab, true));
    tab.addEventListener('keydown', event => {
      const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
      if (!keys.includes(event.key)) return;
      event.preventDefault();
      const target = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1
        : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      select(tabs[target], true); tabs[target].focus();
    });
  });
  const openSection = target => {
    const section = document.getElementById(target);
    if (!section) return;
    const tab = section.closest('.tab-content')?.id || target;
    const trigger = tabs.find(item => item.dataset.tab === tab);
    if (trigger) select(trigger);
    requestAnimationFrame(() => section.scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth', block: 'start' }));
  };
  window.CheshuyaHome = { openSection };
  const navigation = performance.getEntriesByType("navigation")[0];
  const freshEntry = navigation?.type !== "back_forward";
  const startAtTop = () => {
    if (location.hash) return;
    if (tabs[0]) select(tabs[0]);
    scrollTo({ top: 0, left: 0, behavior: "instant" });
  };
  const openHash = () => {
    if (!location.hash) return startAtTop();
    let target;
    try { target = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    openSection(target);
  };
  addEventListener("hashchange", openHash);
  addEventListener("pageshow", event => {
    if (!event.persisted && freshEntry && !location.hash) startAtTop();
  });
  if (location.hash) openHash();
  else if (freshEntry) startAtTop();
  const drawingRail = document.querySelector('#drawings .rail-scroll');
  const drawingCatalogLabel = document.querySelector('#drawings .catalog-link-label');
  if (drawingCatalogLabel) drawingCatalogLabel.textContent = 'Все рисунки';
  if (drawingRail) {
    const categories = [
      { slug:'paper', title:'На бумаге', image:'images/drawings/paper/1/01' },
      { slug:'canvas', title:'На холстах', image:'images/drawings/canvas/1/01' },
      { slug:'wood', title:'По дереву', image:'images/drawings/wood/1/01' },
    ];
    drawingRail.innerHTML = categories.map(({slug,title,image}) =>
      `<article class="archive-card" data-drawing-category="${slug}"><a class="archive-card-link" href="drawing.html?surface=${slug}"><div class="archive-image"><img src="${image}-600.webp" srcset="${image}-600.webp 600w, ${image}-1200.webp 1200w" sizes="250px" alt="${title}" loading="lazy" decoding="async"></div><div class="archive-caption"><strong>${title}</strong></div></a></article>`
    ).join('');
  }
  document.querySelectorAll('.rail').forEach(rail => {
    const viewport = rail.querySelector('.rail-scroll');
    const controller = window.CheshuyaCarousel.createCardCarousel(viewport, { preloadImages: true });
    rail.querySelector('.rail-prev')?.addEventListener('click', () => controller.move(-1));
    rail.querySelector('.rail-next')?.addEventListener('click', () => controller.move(1));
  });
  const translations = [
    ['.static-tabs [data-tab="outside"]', 'work in context'],
    ['.static-tabs [data-tab="inside"]', 'work with material'],
    ['.street-feature h1', 'Street drawing'],
    ['.street-feature p', 'Searching for new places and structures beyond familiar routes. The work begins with getting to know the space and its particular features. The drawing is created on site, without a preliminary sketch, and changes in response to the surface and surrounding conditions.'],
    ['#zines h2', 'Printed editions'], ['#cyanotype h2', 'Cyanotype'], ['#merch h2', 'Merch'],
    ['#objects .section-description', 'Working with different materials and combinations of techniques. Their properties and methods of processing become the basis for experimentation and improvisation. Form emerges during the work, and the finished objects can exist in different spaces and contexts.'],
    ['#drawings .section-description', 'Graphics and painting: series of works on paper, canvas and wood.'],
    ['#drawings [data-drawing-category="paper"] strong', 'On paper'],
    ['#drawings [data-drawing-category="canvas"] strong', 'On canvas'],
    ['#drawings [data-drawing-category="wood"] strong', 'On wood'],
    ['#exhibitions h2', 'Exhibitions'], ['#objects h2', 'Objects'], ['#drawings h2', 'Graphics'],
    ['#zines .section-heading a .catalog-link-label', 'All zines'], ['#cyanotype .section-heading a .catalog-link-label', 'All prints'],
    ['#exhibitions .section-heading a .catalog-link-label', 'All exhibitions'], ['#objects .section-heading a .catalog-link-label', 'All objects'], ['#drawings .section-heading a .catalog-link-label', 'All drawings'], ['#merch .section-heading a .catalog-link-label', 'View all'],
  ].flatMap(([selector,en]) => [...document.querySelectorAll(selector)].map(node => ({node,ru:node.textContent,en})));
  const applyLocale = locale => {
    const english = locale === "en";
    translations.forEach(({node,ru,en}) => { node.textContent = english ? en : ru; });
  };
  document.addEventListener("cheshuya:locale", event => applyLocale(event.detail));
  applyLocale(window.CheshuyaLocale?.get() || "ru");
})();
