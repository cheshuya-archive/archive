(() => {
  const categories = {
    paper: { ru: 'На бумаге', en: 'On paper', series: [['1', 6], ['2', 6], ['2-2', 5], ['3', 3], ['4', 7], ['5', 11]] },
    canvas: { ru: 'На холстах', en: 'On canvas', series: [['1', 2], ['2', 3]] },
    wood: { ru: 'По дереву', en: 'On wood', series: [['1', 8], ['2', 8]] },
  };
  const seriesCopy = {
    paper: {
      titles: [
        ['Без названия', 'Untitled'], ['Полуденный сон', 'Midday Dream'],
        ['Без названия', 'Untitled'], ['Без названия', 'Untitled'],
        ['Без названия', 'Untitled'], ['Медь', 'Copper'],
      ],
      size: ['21 × 29,7 см — А4', '21 × 29.7 cm — A4'],
      technique: ['Аэрозоль, акрил на бумаге', 'Spray paint, acrylic on paper'],
      year: '2019',
    },
    canvas: {
      titles: [['Без названия', 'Untitled'], ['Отскок', 'Rebound']],
      size: ['29,7 × 42 см — А3', '29.7 × 42 cm — A3'],
      technique: ['Акрил, маркеры, аэрозоль; холст на картоне', 'Acrylic, markers, spray paint; canvas on board'],
      year: '2018',
    },
    wood: {
      titles: [['Без названия', 'Untitled'], ['Ускользающий свет', 'Elusive Light']],
      technique: ['Морилка, лак на фанере', 'Wood stain, varnish on plywood'],
      year: '2020',
    },
  };
  const locale = () => window.CheshuyaLocale?.get() || 'ru';
  const categoryOrder = Object.keys(categories);
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
    document.querySelector('#drawing-breadcrumb-current').textContent = category[language];
    document.title = `${category[language]} — Чешуя`;
    const pagination = document.querySelector('.drawing-pagination');
    pagination.setAttribute('aria-label', language === 'en' ? 'Other graphics categories' : 'Другие разделы графики');
    pagination.querySelector('.drawing-prev').setAttribute('aria-label', `${language === 'en' ? 'Previous category' : 'Предыдущий раздел'}: ${categories[categoryOrder[(categoryOrder.indexOf(surface) + categoryOrder.length - 1) % categoryOrder.length]][language]}`);
    pagination.querySelector('.drawing-next').setAttribute('aria-label', `${language === 'en' ? 'Next category' : 'Следующий раздел'}: ${categories[categoryOrder[(categoryOrder.indexOf(surface) + 1) % categoryOrder.length]][language]}`);
    const copy = seriesCopy[surface];
    const languageIndex = language === 'en' ? 1 : 0;
    list.querySelectorAll('.zine-carousel').forEach(carousel => {
      const seriesIndex = Number(carousel.dataset.seriesIndex);
      const title = copy.titles[seriesIndex][languageIndex];
      const info = carousel.parentElement.querySelector('.drawing-series-info');
      info.querySelector('[data-series-title]').textContent = title;
      info.querySelectorAll('[data-series-spec]').forEach(value => {
        const key = value.dataset.seriesSpec;
        value.textContent = key === 'year' ? copy.year : copy[key][languageIndex];
      });
      info.querySelectorAll('[data-series-label]').forEach(label => {
        label.textContent = (language === 'en'
          ? { size:'Size', technique:'Technique', year:'Year' }
          : { size:'Размер', technique:'Техника', year:'Год' })[label.dataset.seriesLabel];
      });
      carousel.setAttribute('aria-label', `${language === 'en' ? 'Gallery' : 'Галерея'}: ${title}`);
      carousel.querySelector('.prev')?.setAttribute('aria-label', language === 'en' ? 'Previous image' : 'Предыдущее фото');
      carousel.querySelector('.next')?.setAttribute('aria-label', language === 'en' ? 'Next image' : 'Следующее фото');
      carousel.querySelectorAll('.zine-photo').forEach((photo, index) => {
        photo.alt = `${title}, ${category[language]} — ${language === 'en' ? 'photo' : 'фото'} ${index + 1}`;
      });
    });
  };
  document.addEventListener('cheshuya:locale', event => translate(event.detail));
  if (!list) { translate(locale()); return; }
  if (!categories[surface]) { location.replace('catalog-drawings.html'); return; }
  const currentCategoryIndex = categoryOrder.indexOf(surface);
  document.querySelector('.drawing-prev').href = `drawing.html?surface=${categoryOrder[(currentCategoryIndex + categoryOrder.length - 1) % categoryOrder.length]}`;
  document.querySelector('.drawing-next').href = `drawing.html?surface=${categoryOrder[(currentCategoryIndex + 1) % categoryOrder.length]}`;

  for (const [seriesIndex, [series, count]] of categories[surface].series.entries()) {
    const section = document.createElement('section');
    section.className = 'drawing-series';
    section.id = `series-${series}`;
    const carousel = document.createElement('div');
    carousel.className = 'zine-carousel';
    carousel.dataset.series = series;
    carousel.dataset.seriesIndex = String(seriesIndex);
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
    const specs = document.createElement('dl');
    specs.className = 'drawing-series-specs';
    for (const key of ['size', 'technique', 'year']) {
      if (!seriesCopy[surface][key]) continue;
      const row = document.createElement('div');
      const label = document.createElement('dt');
      label.dataset.seriesLabel = key;
      const value = document.createElement('dd');
      value.dataset.seriesSpec = key;
      row.append(label, value);
      specs.append(row);
    }
    info.append(specs);
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
