(() => {
  const exhibitions = [
    { id: 'polya-prisutstviya', title: 'Поля присутствия', year: '2026', description: 'Дуо-выставка, ДНИ, Москва, 2026', count: 30 },
    { id: 'uyazvimoe-mesto', title: 'Уязвимое место', year: '2026', description: 'KMSA, Kazan 2026', count: 12 },
    { id: 'portal', title: 'Portal', year: '2024', description: 'Off-site show at Protvino, 2024', count: 13 },
    { id: 'black-show', title: 'Black show', year: '2024', description: 'Off-site show at Protvino, 2024', count: 12 },
    { id: 'rusty-box', title: 'Rusty Box', year: '2023', description: 'Групповая выставка, Алматы, 2023', count: 10, extension: 'png' },
    { id: 'sleepy-stupor', title: 'Sleeppy stupor', year: '2023', description: 'Off-site show at Almaty, 2023', count: 8 },
    { id: 'deep-woods-cold-winters', title: 'Deep Woods Cold Winters', year: '2022', description: 'Групповая выставка, ISSMAG, Москва, 2022', count: 9 },
    { id: 'rekviem-po-zhek-artu', title: 'Реквием по ЖЭК-арту', year: '2022', description: 'Групповая выставка, Музей ДПИ, Москва, 2022', count: 9, extension: 'jpg' },
  ];
  const exhibitionBase = (item, index = 1) => `new-site-assets/exhibitions/${item.id}/${String(index).padStart(2, '0')}`;
  window.cheshuyaExhibitions = exhibitions;
  window.cheshuyaExhibitionBase = exhibitionBase;

  const header = document.querySelector('.archive-header, .catalog-header, .zine-header');
  if (!header) return;
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('a.catalog-card-link:not([aria-label])').forEach(link => {
      const label = link.querySelector('img[alt]')?.alt || link.querySelector('strong')?.textContent?.trim();
      if (label) link.setAttribute('aria-label', label);
    });
  }, { once: true });
  const isHome = header.classList.contains('archive-header');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const behavior = () => motion.matches ? 'instant' : 'smooth';
  document.addEventListener('DOMContentLoaded', () => {
    if (motion.matches || !('IntersectionObserver' in window)) return;
    const groups = document.querySelectorAll('.street-feature, .inside-intro, .archive-section, .catalog-grid, .zine-layout, .drawing-series, .exhibition-video, .cyanotype-video');
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px 48px 0px', threshold: 0.05 });
    groups.forEach(group => {
      group.classList.add('page-reveal-pending');
      observer.observe(group);
    });
  }, { once: true });
  if (/iP(hone|ad|od)/.test(navigator.userAgent) && (/Telegram/i.test(navigator.userAgent) || /t\.me\//i.test(document.referrer))) {
    document.documentElement.classList.add('telegram-ios');
  }

  const readPreference = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const savePreference = (key, value) => { try { localStorage.setItem(key, value); } catch {} };
  const themeButton = document.createElement("button");
  themeButton.type = "button";
  themeButton.className = "theme-toggle";
  themeButton.innerHTML = "<svg class=\"theme-moon\" viewBox=\"0 0 24 24\" width=\"18\" height=\"18\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" aria-hidden=\"true\"><path d=\"M20.8 13A9 9 0 0 1 11 3.2 9 9 0 1 0 20.8 13Z\"/></svg><svg class=\"theme-sun\" viewBox=\"0 0 24 24\" width=\"18\" height=\"18\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4\"/></svg>";
  const themeButtons = [themeButton];
  const controls = header.querySelector(".header-controls, .catalog-global-controls, .zine-global-controls");
  if (isHome) controls?.prepend(themeButton);
  const languageButton = header.querySelector(".language-button") || document.createElement("button");
  languageButton.type = "button";
  languageButton.className = "language-button";
  let locale = readPreference("cheshuya-locale") === "en" ? "en" : "ru";
  const savedTheme = readPreference("cheshuya-theme");
  let explicitTheme = savedTheme === "light" || savedTheme === "dark" ? savedTheme : null;
  const systemTheme = matchMedia("(prefers-color-scheme: dark)");
  const syncThemeButton = () => {
    const dark = document.documentElement.dataset.theme === "dark";
    const label = locale === "en" ? (dark ? "Use light theme" : "Use dark theme") : (dark ? "Включить светлую тему" : "Включить тёмную тему");
    themeButtons.forEach(button => {
      button.setAttribute("aria-label", label);
      button.setAttribute("title", label);
      button.setAttribute("aria-pressed", String(dark));
    });
  };
  const applyTheme = theme => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    syncThemeButton();
  };
  const toggleTheme = () => {
    explicitTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    savePreference("cheshuya-theme", explicitTheme);
    applyTheme(explicitTheme);
  };
  themeButton.addEventListener("click", toggleTheme);
  systemTheme.addEventListener("change", () => { if (!explicitTheme) applyTheme(systemTheme.matches ? "dark" : "light"); });
  syncThemeButton();

  const burger = header.querySelector('.header-controls button:last-child, .catalog-burger, .zine-burger');
  header.querySelector('.catalog-language, .zine-language')?.remove();
  header.querySelector('.catalog-global-controls, .zine-global-controls')?.classList.add('inner-header-controls');
  if (!isHome) {
    const back = header.querySelector('.back-icon');
    const page = location.pathname;
    if (back) back.href = page.endsWith('drawing.html')
      ? 'catalog-drawings.html'
      : page.endsWith('catalog-objects-ceramic.html') || page.endsWith('catalog-objects-metal.html')
      ? 'catalog-objects.html'
      : page.endsWith('merch-dom-white.html') || page.endsWith('merch-dom-black.html')
        ? 'catalog-merch.html'
      : page.endsWith('object.html')
        ? `catalog-objects-${new URLSearchParams(location.search).get('id')?.startsWith('metal-') ? 'metal' : 'ceramic'}.html`
        : header.classList.contains('catalog-header')
          ? 'index.html'
          : page.endsWith('exhibition.html') ? 'catalog-exhibitions.html' : page.endsWith('cyanotype.html') ? 'index.html' : 'catalog-prints.html';
    const logo = document.createElement('a');
    logo.className = 'site-home-logo';
    logo.href = 'index.html';
    logo.setAttribute('aria-label', 'На главную');
    logo.innerHTML = '<img src="media/cheshuya-figma-logo.svg" width="30" height="30" alt="Чешуя">';
    header.prepend(logo);
  }
  if (burger) {
    const main = document.querySelector('main');
    const menu = document.createElement('nav');
    menu.id = 'site-menu';
    menu.className = isHome ? 'static-menu' : 'zine-menu';
    menu.hidden = true;
    menu.setAttribute('role', 'dialog');
    menu.setAttribute('aria-modal', 'true');
    menu.setAttribute('aria-label', 'Меню');
    const links = [
      ['zines', 'Печатные издания', 'catalog-prints.html'],
      ['cyanotype', 'Цианотипия', 'cyanotype.html'],
      ['merch', 'Мерч', 'catalog-merch.html'],
      ['exhibitions', 'Выставки', 'catalog-exhibitions.html'],
      ['objects', 'Объекты', 'catalog-objects.html'],
      ['drawings', 'Графика', 'catalog-drawings.html'],
    ];
    const closeClass = isHome ? 'static-menu-close' : 'zine-menu-close';
    menu.innerHTML = '<button type="button" class="' + closeClass + '" aria-label="Закрыть меню">×</button>';
    const homeLink = document.createElement('a');
    homeLink.className = 'menu-home-link';
    homeLink.dataset.target = 'home';
    homeLink.href = 'index.html';
    homeLink.textContent = 'Главная';
    menu.append(homeLink);
    const columns = document.createElement('div');
    columns.className = 'menu-columns';
    menu.append(columns);
    let group;
    links.forEach(([target,label,href],index) => {
      if (index === 0 || index === 3) {
        group = document.createElement('div');
        group.className = 'menu-group';
        const heading = document.createElement('p');
        heading.textContent = index === 0 ? 'Работа в среде' : 'Работа с материалом';
        group.append(heading);
        columns.append(group);
      }
      const item = document.createElement('a');
      item.dataset.target = target;
      item.textContent = label;
      item.href = href;
      group.append(item);
    });
    const preferences = document.createElement("div");
    preferences.className = "menu-preferences";
    const menuThemeButton = themeButton.cloneNode(true);
    menuThemeButton.addEventListener("click", toggleTheme);
    themeButtons.push(menuThemeButton);
    preferences.append(languageButton, menuThemeButton);
    menu.append(preferences);
    const englishLabels = { home:"Home", zines:"Printed editions", cyanotype:"Cyanotype", merch:"Merch", exhibitions:"Exhibitions", objects:"Objects", drawings:"Graphics" };
    const innerTranslations = [...menu.querySelectorAll("[data-target]")].map(node => ({ node, ru:node.textContent, en:englishLabels[node.dataset.target] }));
    [...menu.querySelectorAll("p")].forEach((node,index) => innerTranslations.push({ node, ru:node.textContent, en:index === 0 ? "Work in context" : "Work with material" }));
    const heading = document.querySelector(".catalog-page h1, .cyanotype-page h1");
    const headingNames = { "Печатные издания":"Printed editions", "Выставки":"Exhibitions", "Объекты":"Objects", "Рисунки":"Graphics", "Графика":"Graphics", "Мерч":"Merch", "Цианотипия":"Cyanotype" };
    if (heading && headingNames[heading.textContent]) innerTranslations.push({ node:heading, ru:heading.textContent, en:headingNames[heading.textContent] });
    const sectionLabels = { home:["Главная","Home"], prints:["Печатные издания","Printed editions"], exhibitions:["Выставки","Exhibitions"], objects:["Объекты","Objects"], drawings:["Графика","Graphics"], merch:["Мерч","Merch"], cyanotype:["Цианотипия","Cyanotype"], ceramic:["Керамика","Ceramics"], metal:["Металл","Metal"] };
    const applyLocale = () => {
      document.querySelectorAll("[data-section-label]").forEach(node => {
        const labels = sectionLabels[node.dataset.sectionLabel];
        if (labels) node.textContent = labels[locale === "en" ? 1 : 0];
      });
      document.querySelectorAll(".section-breadcrumbs").forEach(nav => nav.setAttribute("aria-label", locale === "en" ? "Breadcrumb" : "Путь по разделам"));
      document.documentElement.lang = locale;
      languageButton.textContent = locale === "ru" ? "En" : "Ru";
      languageButton.setAttribute("aria-label", locale === "ru" ? "Сменить язык" : "Switch language");
      innerTranslations.forEach(({node,ru,en}) => { node.textContent = locale === "en" ? en : ru; });
      syncThemeButton();
      document.dispatchEvent(new CustomEvent("cheshuya:locale", { detail:locale }));
    };
    languageButton.addEventListener("click", () => {
      locale = locale === "ru" ? "en" : "ru";
      savePreference("cheshuya-locale", locale);
      applyLocale();
    });
    window.CheshuyaLocale = { get: () => locale };
    window.addEventListener("storage", event => {
      if (event.key === "cheshuya-locale" || event.key === null) {
        locale = readPreference("cheshuya-locale") === "en" ? "en" : "ru";
        applyLocale();
      }
      if (event.key === "cheshuya-theme" || event.key === null) {
        const stored = readPreference("cheshuya-theme");
        explicitTheme = stored === "light" || stored === "dark" ? stored : null;
        applyTheme(explicitTheme || (systemTheme.matches ? "dark" : "light"));
      }
    });
    applyLocale();
    const overlay = document.createElement('div');
    overlay.className = isHome ? 'static-menu-overlay' : 'zine-menu-overlay';
    overlay.hidden = true;
    document.body.append(overlay, menu);
    burger.setAttribute('aria-label', 'Открыть меню');
    burger.setAttribute('aria-controls', menu.id);
    burger.setAttribute('aria-expanded', 'false');
    let overflow = '';
    let closing = null;
    let openingTimer = null;
    const finishOpen = () => {
      clearTimeout(openingTimer);
      openingTimer = null;
      menu.classList.remove('is-opening');
    };
    menu.addEventListener('animationend', event => {
      if (event.target === menu && event.animationName === 'drawer-in') finishOpen();
    });
    const finishClose = (after) => {
      finishOpen();
      menu.hidden = true;
      menu.classList.remove('is-closing');
      main.inert = false;
      document.body.style.overflow = overflow;
      burger.setAttribute('aria-expanded', 'false');
      burger.focus({ preventScroll: true });
      closing = null;
      if (typeof after === 'function') after();
    };
    const close = (after) => {
      if (menu.hidden || closing !== null) return;
      finishOpen();
      overlay.hidden = true;
      if (motion.matches) return finishClose(after);
      menu.classList.add('is-closing');
      closing = setTimeout(() => finishClose(after), 240);
    };
    burger.addEventListener('click', () => {
      if (!menu.hidden) return close();
      overflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      main.inert = true;
      menu.classList.add('is-opening');
      menu.hidden = false;
      overlay.hidden = false;
      burger.setAttribute('aria-expanded', 'true');
      menu.querySelector('button').focus();
      openingTimer = setTimeout(finishOpen, 320);
    });
    menu.querySelector('.' + closeClass).addEventListener('click', () => close());
    overlay.addEventListener('click', () => close());
    menu.querySelectorAll('[data-target]').forEach(item => item.addEventListener('click', event => {
      // Preserve native link behavior for a new tab or modified click.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      close(() => {
        location.href = item.href;
      });
    }));
    document.addEventListener('keydown', event => {
      if (menu.hidden) return;
      if (event.key === 'Escape') { event.preventDefault(); close(); }
      if (event.key === 'Tab') {
        const focusable = [...menu.querySelectorAll('button, a[href]')];
        const first = focusable[0], last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
  }
  if (isHome) {
    const stage = document.querySelector('.logo-stage');
    const logo = stage?.querySelector('img');
    const controls = header.querySelector('.header-controls');
    if (!stage || !logo || !controls) return;
    let center = 0, startSize = 142, headerY = 34.5, frame = null, contentWidth = 83;
    const render = () => {
      frame = null;
      if (motion.matches) {
        logo.classList.remove('home-moving-logo');
        logo.classList.add('home-at-stage');
        controls.style.removeProperty('width');
        return;
      }
      const currentScroll = Math.max(0, scrollY);
      const progress = Math.min(1, currentScroll / 135);
      const size = startSize + (37 - startSize) * progress;
      logo.setAttribute('aria-label', size >= 100 ? (locale === 'en' ? 'Hold to attract logo particles' : 'Зажмите, чтобы притянуть частицы') : (locale === 'en' ? 'Back to top' : 'Наверх'));
      logo.classList.remove('home-at-stage');
      logo.classList.add('home-moving-logo');
      logo.style.top = (center - currentScroll + (headerY - center + currentScroll) * progress) + 'px';
      logo.style.width = logo.style.height = size + 'px';
      controls.style.width = (83 + (contentWidth - 83) * progress) + 'px';
      controls.style.justifyContent = 'space-between';
      header.classList.toggle('is-compact', progress > .96);
    };
    const measure = () => {
      const rect = stage.getBoundingClientRect(), style = getComputedStyle(stage);
      const top = parseFloat(style.paddingTop) || 0, bottom = parseFloat(style.paddingBottom) || 0;
      center = rect.top + Math.max(0, scrollY) + top + (rect.height - top - bottom) / 2;
      startSize = matchMedia('(min-width:641px)').matches ? 162 : 142;
      const button = controls.querySelector('button').getBoundingClientRect();
      headerY = button.top + button.height / 2;
      contentWidth = Math.max(83, Math.min(640, innerWidth - 32));
      render();
    };
    addEventListener('scroll', () => { if (frame === null) frame = requestAnimationFrame(render); }, { passive: true });
    let viewportWidth = innerWidth;
    const remeasureIfNeeded = () => {
      const rect = stage.getBoundingClientRect(), style = getComputedStyle(stage);
      const top = parseFloat(style.paddingTop) || 0, bottom = parseFloat(style.paddingBottom) || 0;
      const nextCenter = rect.top + Math.max(0, scrollY) + top + (rect.height - top - bottom) / 2;
      if (innerWidth === viewportWidth && Math.abs(nextCenter - center) < .5) return;
      viewportWidth = innerWidth;
      measure();
    };
    addEventListener('resize', remeasureIfNeeded);
    window.visualViewport?.addEventListener('resize', remeasureIfNeeded, { passive: true });
    addEventListener('pageshow', measure);
    motion.addEventListener('change', measure);
    const top = () => scrollTo({ top: 0, behavior: behavior() });
    logo.tabIndex = 0;
    logo.setAttribute('role', 'button');
    logo.setAttribute('aria-label', 'Наверх');
    const activateLogo = () => { if (!window.CheshuyaLogo?.handles(logo)) top(); };
    logo.addEventListener('click', activateLogo);
    logo.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activateLogo(); } });
    logo.style.cursor = 'pointer';
    measure();
  }
})();
