(() => {
  // Exhibition titles and the short Text property are taken from the Notion export.
  // The first numbered source image is the cover; Rusty box starts at 2.png.
  const exhibitions = [
    { id: 'polya-prisutstviya', title: 'Поля присутствия', year: '2026', description: 'ДНИ, Москва 2026', count: 30 },
    { id: 'uyazvimoe-mesto', title: 'Уязвимое место', year: '2026', description: 'KMSA, Kazan 2026', count: 12 },
    { id: 'portal', title: 'Portal', year: '2024', description: 'Оff-site show at Protvino, 2024', count: 13 },
    { id: 'black-show', title: 'Black show', year: '2024', description: 'Оff-site show at Protvino, 2024', count: 12 },
    { id: 'rusty-box', title: 'Rusty box', year: '2023', description: 'Оff-site show at Almaty, December 2023', count: 10, extension: 'png' },
    { id: 'sleepy-stupor', title: 'Sleeppy stupor', year: '2023', description: 'Оff-site show at Almaty, 2023', count: 8 },
    { id: 'deep-woods-cold-winters', title: 'Deep Woods Cold Winters', year: '2022', description: 'ISSMAG gallery, Moscow, 2022', count: 9 },
    { id: 'rekviem-po-zhek-artu', title: 'Реквием по ЖЭК-арту', year: '2022', description: 'VMDPNI, Moscow, 2022', count: 9, extension: 'jpg' },
  ];
  const exhibitionBase = (item, index = 1) => `new-site-assets/exhibitions/${item.id}/${String(index).padStart(2, '0')}`;
  window.cheshuyaExhibitions = exhibitions;
  window.cheshuyaExhibitionBase = exhibitionBase;
  const header = document.querySelector('.archive-header, .catalog-header, .zine-header');
  if (!header) return;
  const isHome = header.classList.contains('archive-header');

  const isTelegramIOS = /iP(hone|ad|od)/.test(navigator.userAgent)
    && (/Telegram/i.test(navigator.userAgent) || /t\.me\//i.test(document.referrer));
  if (isTelegramIOS) document.documentElement.classList.add('telegram-ios');

  const setResponsiveImage = (selector, base) => {
    const image = document.querySelector(selector);
    if (!image) return;
    image.src = `images/${base}-1200.webp`;
    image.srcset = `images/${base}-600.webp 600w, images/${base}-1200.webp 1200w, images/${base}-2000.webp 2000w`;
    image.sizes = '(max-width: 700px) 100vw, 600px';
  };
  const setImageSource = (image, base) => {
    if (!image) return;
    image.src = `images/${base}-1200.webp`;
    image.srcset = `images/${base}-600.webp 600w, images/${base}-1200.webp 1200w, images/${base}-2000.webp 2000w`;
    image.sizes = '(max-width: 700px) 100vw, 600px';
  };
  const exhibitionCard = (item, home = false) => {
    const card = document.createElement('article');
    card.className = home ? 'archive-card' : 'catalog-card';
    card.dataset.exhibitionId = item.id;
    const imageWrap = document.createElement('div');
    imageWrap.className = home ? 'archive-image' : 'catalog-image';
    const image = document.createElement('img');
    image.alt = item.title;
    image.loading = 'lazy';
    setImageSource(image, exhibitionBase(item));
    imageWrap.append(image);
    const caption = document.createElement('div');
    caption.className = home ? 'archive-caption' : 'catalog-caption';
    const title = document.createElement('strong');
    title.textContent = item.title;
    const year = document.createElement('span');
    year.textContent = item.year;
    caption.append(title, year);
    card.append(imageWrap, caption);
    return card;
  };
  const enableRailInteractions = (rail) => {
    if (!rail || rail.dataset.carouselReady) return;
    rail.dataset.carouselReady = 'true';
    const viewport = rail.querySelector('.rail-scroll');
    if (!viewport) return;
    viewport.tabIndex = 0;
    viewport.setAttribute('aria-label', 'Галерея работ');
    const step = () => Math.max(220, viewport.clientWidth * .8);
    const move = (direction) => {
      if (viewport.scrollWidth <= viewport.clientWidth + 2) return;
      const atStart = viewport.scrollLeft <= 2;
      const atEnd = viewport.scrollLeft + viewport.clientWidth >= viewport.scrollWidth - 2;
      if (direction < 0 && atStart) viewport.scrollTo({ left: viewport.scrollWidth, behavior: 'smooth' });
      else if (direction > 0 && atEnd) viewport.scrollTo({ left: 0, behavior: 'smooth' });
      else viewport.scrollBy({ left: direction * step(), behavior: 'smooth' });
    };
    viewport.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
    });
    let pointerStart = 0, scrollStart = 0, startedAt = 0, dragging = false;
    viewport.addEventListener('pointerdown', (event) => {
      startedAt = viewport.scrollLeft;
      if (event.pointerType !== 'mouse') return;
      pointerStart = event.clientX;
      scrollStart = viewport.scrollLeft;
      dragging = true;
      viewport.setPointerCapture?.(event.pointerId);
    });
    viewport.addEventListener('pointermove', (event) => {
      if (!dragging) return;
      const delta = event.clientX - pointerStart;
      if (Math.abs(delta) > 3) viewport.scrollLeft = scrollStart - delta;
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => viewport.addEventListener(type, () => { dragging = false; }));
    rail.querySelector('.rail-prev')?.addEventListener('click', (event) => { event.preventDefault(); event.stopImmediatePropagation(); move(-1); }, true);
    rail.querySelector('.rail-next')?.addEventListener('click', (event) => { event.preventDefault(); event.stopImmediatePropagation(); move(1); }, true);
    let scrollEndTimer;
    viewport.addEventListener('scroll', () => {
      window.clearTimeout(scrollEndTimer);
      scrollEndTimer = window.setTimeout(() => {
        if (dragging || viewport.scrollWidth <= viewport.clientWidth + 2) return;
        if (viewport.scrollLeft + viewport.clientWidth >= viewport.scrollWidth - 2) viewport.scrollTo({ left: 0, behavior: 'smooth' });
        else if (viewport.scrollLeft <= 1 && startedAt > 2) viewport.scrollTo({ left: viewport.scrollWidth, behavior: 'smooth' });
      }, 180);
    }, { passive: true });
  };
  const makeMerchCarousel = () => {
    const section = document.querySelector('.merch-section');
    const card = section?.querySelector('.archive-card');
    if (!section || !card || section.querySelector('.rail-scroll')) return;
    const rail = document.createElement('div');
    rail.className = 'rail rail-art merch-carousel';
    rail.innerHTML = '<div class="rail-scroll"></div><button class="rail-arrow rail-prev" type="button" aria-label="Предыдущая фотография">←</button><button class="rail-arrow rail-next" type="button" aria-label="Следующая фотография">→</button>';
    const viewport = rail.querySelector('.rail-scroll');
    const secondCard = card.cloneNode(true);
    setImageSource(secondCard.querySelector('img'), 'new-site-assets/merch/image%2075');
    card.replaceWith(rail);
    viewport.append(card, secondCard);
    enableRailInteractions(rail);
  };
  const addHomeCyanotypes = () => {
    const viewport = document.querySelector('#cyanotype .rail-scroll');
    if (!viewport || viewport.dataset.extraCyanotypes) return;
    viewport.dataset.extraCyanotypes = 'true';
    ['5wvXjj3rEZI', 'AZYeIfJK54o', 'CY5UIwCFX20', 'D1cWDhqV32c', 'GCMmpzFu8cM'].forEach((name, index) => {
      const slide = document.createElement('article');
      slide.className = 'cyanotype-slide';
      const image = document.createElement('img');
      image.alt = `Цианотипия ${index + 3}`;
      image.loading = 'lazy';
      setImageSource(image, `new-site-assets/cyanotypes/${name}`);
      slide.append(image);
      viewport.append(slide);
    });
  };
  window.setTimeout(() => {
    const exhibitionRail = document.querySelector('#exhibitions .rail-scroll');
    if (exhibitionRail) exhibitionRail.replaceChildren(...exhibitions.map((item) => exhibitionCard(item, true)));
    setResponsiveImage('.street-feature .feature-image img', 'new-site-assets/environment/street-feature');
    setResponsiveImage('#zines .archive-card:nth-of-type(1) img', 'new-site-assets/zines/nedostatochno-pamyati/cover');
    setResponsiveImage('#zines .archive-card:nth-of-type(2) img', 'new-site-assets/zines/ubezhishche/IMG_20200621_165755');
    setResponsiveImage('#zines .archive-card:nth-of-type(3) img', 'new-site-assets/zines/sloi/DboMwpEfEh4');
    setResponsiveImage('#cyanotype .cyanotype-slide:nth-of-type(1) img', 'new-site-assets/cyanotypes/3Zlo6afGt3c');
    setResponsiveImage('#cyanotype .cyanotype-slide:nth-of-type(2) img', 'new-site-assets/cyanotypes/4fZgpzXQfcE');
    document.querySelector('#cyanotype .section-description')?.remove();
    addHomeCyanotypes();
    setResponsiveImage('.merch-section .archive-image img', 'new-site-assets/merch/image%2074');
    setResponsiveImage('.catalog-card-link:nth-of-type(1) .catalog-image img', 'new-site-assets/zines/nedostatochno-pamyati/cover');
    setResponsiveImage('.catalog-card-link:nth-of-type(2) .catalog-image img', 'new-site-assets/zines/ubezhishche/IMG_20200621_165755');
    setResponsiveImage('.catalog-card-link:nth-of-type(3) .catalog-image img', 'new-site-assets/zines/sloi/DboMwpEfEh4');
    document.querySelectorAll('.rail').forEach(rail => enableRailInteractions(rail));
    makeMerchCarousel();
  }, 0);

  if (isHome) {
    const stage = document.querySelector('.logo-stage');
    const logo = stage?.querySelector('img');
    const controls = header.querySelector('.header-controls');
    if (!stage || !logo || !controls) return;
    let stageCenter = 0;
    let startSize = 0;
    const measure = () => {
      const rect = stage.getBoundingClientRect();
      const stageStyle = window.getComputedStyle(stage);
      const paddingTop = Number.parseFloat(stageStyle.paddingTop) || 0;
      const paddingBottom = Number.parseFloat(stageStyle.paddingBottom) || 0;
      const contentHeight = rect.height - paddingTop - paddingBottom;
      stageCenter = rect.top + window.scrollY + paddingTop + contentHeight / 2;
      startSize = window.matchMedia('(min-width: 641px)').matches ? 162 : 142;
    };
    const render = () => {
      const progress = Math.max(0, Math.min(1, window.scrollY / 135));
      const size = startSize + (37 - startSize) * progress;
      const naturalY = stageCenter - window.scrollY;
      const headerButton = controls.querySelector('button');
      const headerY = headerButton ? headerButton.getBoundingClientRect().top + headerButton.getBoundingClientRect().height / 2 : 34.5;
      const y = naturalY + (headerY - naturalY) * progress;
      logo.classList.add('home-moving-logo');
      logo.style.top = `${y}px`;
      logo.style.width = `${size}px`;
      logo.style.height = `${size}px`;
      const contentWidth = Math.max(83, Math.min(640, window.innerWidth - 32));
      controls.style.width = `${83 + (contentWidth - 83) * progress}px`;
      controls.style.justifyContent = 'space-between';
      header.classList.toggle('is-compact', progress > 0.96);
    };
    measure();
    render();
    window.addEventListener('resize', () => { measure(); render(); });
    window.addEventListener('scroll', render, { passive: true });
    logo.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    logo.style.cursor = 'pointer';
    window.setTimeout(() => {
      const tabs = [...document.querySelectorAll('.static-tabs [data-tab]')];
      const content = [...document.querySelectorAll('.tab-content')];
      const drawer = document.querySelector('.static-menu');
      const overlay = document.querySelector('.static-menu-overlay');
      const outsideSections = [...document.querySelectorAll('#outside .archive-section')];
      if (outsideSections[0]) outsideSections[0].id = 'zines';
      if (outsideSections[1]) outsideSections[1].id = 'cyanotype';
      if (outsideSections[2]) outsideSections[2].id = 'merch';
      const insideTargets = new Set(['inside', 'exhibitions', 'objects', 'drawings']);
      const openSection = (target) => {
        const tabName = insideTargets.has(target) ? 'inside' : 'outside';
        tabs.find((item) => item.dataset.tab === tabName)?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        window.setTimeout(() => document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
      };
      const makeCatalogLink = (section, href) => {
        const label = section?.querySelector('.section-heading span');
        if (!label) return;
        const link = document.createElement('a');
        link.href = href;
        link.textContent = label.textContent;
        label.replaceWith(link);
      };
      makeCatalogLink(document.querySelector('#outside .archive-section'), 'catalog-prints.html');
      makeCatalogLink(document.querySelector('#cyanotype'), 'cyanotype.html');
      makeCatalogLink(document.querySelector('#exhibitions'), 'catalog-exhibitions.html');
      makeCatalogLink(document.querySelector('#objects'), 'catalog-objects.html');
      makeCatalogLink(document.querySelector('#drawings'), 'catalog-drawings.html');
      drawer?.querySelector('button[data-target="outside"]')?.remove();
      drawer?.querySelector('button[data-target="inside"]')?.remove();
      const closeDrawer = (after) => {
        if (!drawer || drawer.hidden) return after?.();
        drawer.classList.add('is-closing');
        document.querySelectorAll('.static-menu-overlay, .zine-menu-overlay').forEach((item) => { item.hidden = true; });
        window.setTimeout(() => { drawer.hidden = true; drawer.classList.remove('is-closing'); after?.(); }, 240);
      };
      drawer?.querySelectorAll('button[data-target]').forEach((button) => button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeDrawer(() => {
          const target = button.dataset.target;
          openSection(target);
        });
      }, true));
      tabs.forEach((tab) => tab.addEventListener('pointerdown', (event) => {
        const next = document.getElementById(tab.dataset.tab);
        const current = content.find((item) => !item.hidden);
        if (!next || !current || current === next) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        const direction = tab.dataset.tab === 'inside' ? 'right' : 'left';
        tabs.forEach((item) => item.classList.toggle('active', item === tab));
        current.hidden = true;
        next.hidden = false;
        next.classList.remove('tab-enter-left', 'tab-enter-right');
        void next.offsetWidth;
        next.classList.add(`tab-enter-${direction}`);
        window.setTimeout(() => next.classList.remove(`tab-enter-${direction}`), 360);
      }, true));
      document.addEventListener('click', (event) => {
        const card = event.target.closest('#exhibitions .archive-card');
        if (!card) return;
        const id = card.dataset.exhibitionId;
        if (!id) return;
        event.preventDefault();
        window.location.href = `exhibition.html?id=${id}`;
      });
      const initialTarget = window.location.hash.slice(1);
      if (initialTarget && document.getElementById(initialTarget)) openSection(initialTarget);
    }, 0);
    return;
  }

  if (window.location.pathname.endsWith('catalog-exhibitions.html')) {
    const grid = document.querySelector('.catalog-grid');
    if (grid) grid.replaceChildren(...exhibitions.map((item) => exhibitionCard(item)));
    document.querySelectorAll('.catalog-card').forEach((card) => {
      const id = card.dataset.exhibitionId;
      card.setAttribute('role', 'link');
      card.tabIndex = 0;
      const open = () => { window.location.href = `exhibition.html?id=${id}`; };
      card.addEventListener('click', open);
      card.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } });
    });
  }

  header.querySelector('.catalog-language, .zine-language')?.remove();
  header.querySelector('.catalog-global-controls, .zine-global-controls')?.classList.add('inner-header-controls');
  const back = header.querySelector('.back-icon');
  if (back && header.classList.contains('catalog-header')) {
    const page = window.location.pathname;
    const anchor = page.includes('exhibitions') ? 'exhibitions' : page.includes('objects') ? 'objects' : page.includes('drawings') ? 'drawings' : 'zines';
    back.href = `index.html#${anchor}`;
  } else if (back) back.href = window.location.pathname.endsWith('exhibition.html')
    ? 'catalog-exhibitions.html'
    : window.location.pathname.endsWith('cyanotype.html') ? 'index.html#cyanotype' : 'catalog-prints.html';
  const logo = document.createElement('a');
  logo.className = 'site-home-logo';
  logo.href = 'index.html';
  logo.setAttribute('aria-label', 'На главную');
  logo.innerHTML = '<img src="media/cheshuya-figma-logo.svg" alt="Чешуя">';
  header.prepend(logo);

  // Older static pages create their own drawer before this shared script loads.
  // Remove it along with its overlay so two layers can never remain on the page.
  document.querySelectorAll('.zine-menu, .zine-menu-overlay').forEach((element) => element.remove());
  const oldBurger = header.querySelector('.catalog-burger, .zine-burger');
  if (!oldBurger) return;
  const burger = oldBurger.cloneNode(true);
  oldBurger.replaceWith(burger);
  const overlay = document.createElement('div');
  overlay.className = 'zine-menu-overlay';
  overlay.hidden = true;
  const menu = document.createElement('nav');
  menu.className = 'zine-menu';
  menu.hidden = true;
  menu.innerHTML = '<button class="zine-menu-close" type="button" aria-label="Закрыть меню">×</button><p>Работа в среде</p><a href="catalog-prints.html">Печатные издания</a><a href="cyanotype.html">Цианотипия</a><a href="index.html#merch">Мерч</a><p>Работа с материалом</p><a href="catalog-exhibitions.html">Выставки</a><a href="catalog-objects.html">Объекты</a><a href="catalog-drawings.html">Рисунки</a>';
  document.body.append(overlay, menu);
  const close = (after) => {
    if (menu.hidden) return after?.();
    menu.classList.add('is-closing');
    document.querySelectorAll('.static-menu-overlay, .zine-menu-overlay').forEach((item) => { item.hidden = true; });
    window.setTimeout(() => { menu.hidden = true; menu.classList.remove('is-closing'); after?.(); }, 240);
  };
  burger.addEventListener('click', () => { menu.hidden = false; overlay.hidden = false; });
  overlay.addEventListener('click', close);
  menu.querySelector('.zine-menu-close')?.addEventListener('click', close);
  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', (event) => {
    event.preventDefault();
    close(() => { window.location.href = link.href; });
  }));
})();
