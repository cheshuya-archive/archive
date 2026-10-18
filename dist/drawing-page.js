(() => {
  const categories = {
    paper: { ru: 'На бумаге', en: 'On paper', series: [['1', 6], ['2', 6], ['2-2', 5], ['3', 3], ['4', 7], ['5', 11]] },
    canvas: { ru: 'На холстах', en: 'On canvas', series: [['1', 2], ['2', 3]] },
    wood: { ru: 'По дереву', en: 'On wood', series: [['1', 8], ['2', 8]] },
  };
  const locale = () => window.CheshuyaLocale?.get() || 'ru';
  const surface = new URLSearchParams(location.search).get('surface');
  const list = document.querySelector('#drawing-series-list');

  const translate = language => {
    document.querySelectorAll('[data-drawing-category]').forEach(label => {
      label.textContent = categories[label.dataset.drawingCategory]?.[language] || '';
      const image = label.closest('.catalog-card')?.querySelector('img');
      if (image) image.alt = label.textContent;
    });
    if (!list || !categories[surface]) return;
    const category = categories[surface];
    document.querySelector('#drawing-heading').textContent = category[language];
    document.title = `${category[language]} — Чешуя`;
    list.querySelectorAll('[data-series-title]').forEach(title => {
      title.textContent = `${language === 'en' ? 'Series' : 'Серия'} ${title.dataset.seriesTitle.replace('-', '.')}`;
    });
    list.querySelectorAll('.zine-carousel').forEach(carousel => {
      carousel.setAttribute('aria-label', `${language === 'en' ? 'Gallery' : 'Галерея'} ${carousel.dataset.series.replace('-', '.')}`);
      carousel.querySelector('.prev')?.setAttribute('aria-label', language === 'en' ? 'Previous image' : 'Предыдущее фото');
      carousel.querySelector('.next')?.setAttribute('aria-label', language === 'en' ? 'Next image' : 'Следующее фото');
      carousel.querySelectorAll('.zine-photo').forEach((photo, index) => {
        photo.alt = `${category[language]}, ${language === 'en' ? 'series' : 'серия'} ${carousel.dataset.series.replace('-', '.')}, ${language === 'en' ? 'work' : 'работа'} ${index + 1}`;
      });
    });
  };
  document.addEventListener('cheshuya:locale', event => translate(event.detail));
  if (!list) { translate(locale()); return; }
  if (!categories[surface]) { location.replace('catalog-drawings.html'); return; }

  for (const [series, count] of categories[surface].series) {
    const section = document.createElement('section');
    section.className = 'drawing-series';
    section.id = `series-${series}`;
    const carousel = document.createElement('div');
    carousel.className = 'zine-carousel';
    carousel.dataset.series = series;
    const stage = document.createElement('div');
    stage.className = 'zine-slide';
    const first = document.createElement('img');
    first.className = 'zine-photo';
    first.alt = `${categories[surface].ru}, серия ${series.replace('-', '.')}`;
    first.src = `images/drawings/${surface}/${series}/01-600.webp`;
    first.srcset = `images/drawings/${surface}/${series}/01-600.webp 600w, images/drawings/${surface}/${series}/01-1200.webp 1200w, images/drawings/${surface}/${series}/01-2000.webp 2000w`;
    first.sizes = '(max-width: 700px) calc(100vw - 32px), (max-width: 1112px) calc((100vw - 52px) / 2), 530px';
    first.loading = series === categories[surface].series[0][0] ? 'eager' : 'lazy';
    if (first.loading === 'eager') first.fetchPriority = 'high';
    stage.append(first);
    const controls = document.createElement('div');
    controls.className = 'zine-controls';
    controls.innerHTML = '<button class="prev" type="button" aria-label="Предыдущее фото">←</button><span class="counter"></span><button class="next" type="button" aria-label="Следующее фото">→</button>';
    carousel.append(stage, controls);
    const info = document.createElement('div');
    info.className = 'drawing-series-info';
    const title = document.createElement('h2');
    title.dataset.seriesTitle = series;
    info.append(title);
    section.append(carousel, info);
    list.append(section);

    const photos = Array.from({ length: count }, (_, index) => {
      const base = `images/drawings/${surface}/${series}/${String(index + 1).padStart(2, '0')}`;
      return {
        src: `${base}-1200.webp`,
        srcset: `${base}-600.webp 600w, ${base}-1200.webp 1200w, ${base}-2000.webp 2000w`,
      };
    });
    const counter = controls.querySelector('.counter');
    const gallery = window.CheshuyaCarousel?.mountImageGallery(stage, photos, index => {
      counter.textContent = `${index + 1} / ${count}`;
    });
    stage.querySelectorAll('img').forEach((image, index) => {
      image.alt = `${categories[surface].ru}, серия ${series.replace('-', '.')}, работа ${index + 1}`;
    });
    controls.querySelector('.prev').addEventListener('click', () => gallery?.move(-1));
    controls.querySelector('.next').addEventListener('click', () => gallery?.move(1));
    controls.hidden = count < 2;
  }
  translate(locale());
})();
