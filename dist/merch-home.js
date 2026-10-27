(() => {
  const card = document.querySelector('#merch .merch-product-card');
  const track = card?.querySelector('.merch-photo-track');
  if (!track || !window.CheshuyaCarousel?.createCardCarousel) return;

  const colors = {
    black: {count: 3, sizes: 'M — 55/72 · L — 58/73'},
    white: {count: 2, sizes: 'S — 51/71 · M — 55/72 · L — 58/73 · XL — 63/75'},
  };
  const words = {
    ru: {
      title: 'Футболка «Дом»', black: 'Чёрная', white: 'Белая', colorBlack: 'Чёрный', colorWhite: 'Белый',
      labels: {color: 'Цвет', material: 'Материал', weight: 'Плотность ткани', technique: 'Техника', sizes: 'Размеры'},
      material: '100% хлопок', weight: '180 г/м²', technique: 'Шелкография', photos: 'Фотографии', photo: 'фото',
      previous: 'Предыдущая фотография', next: 'Следующая фотография', colorGroup: 'Цвет футболки',
    },
    en: {
      title: '“Home” T-shirt', black: 'Black', white: 'White', colorBlack: 'Black', colorWhite: 'White',
      labels: {color: 'Color', material: 'Material', weight: 'Fabric weight', technique: 'Technique', sizes: 'Sizes'},
      material: '100% cotton', weight: '180 g/m²', technique: 'Screen printing', photos: 'Photos of the', photo: 'photo',
      previous: 'Previous photo', next: 'Next photo', colorGroup: 'T-shirt color',
    },
  };
  let color = 'black';
  let locale = window.CheshuyaLocale?.get() === 'en' ? 'en' : 'ru';
  let carousel;

  const setText = (selector, value) => {
    const element = card.querySelector(selector);
    if (element) element.textContent = value;
  };
  const renderText = () => {
    const copy = words[locale];
    setText('.merch-product-link strong', copy.title);
    card.querySelector('[data-merch-select="black"]').setAttribute('aria-label', copy.black);
    card.querySelector('[data-merch-select="white"]').setAttribute('aria-label', copy.white);
    Object.entries(copy.labels).forEach(([key, value]) => setText(`[data-merch-label="${key}"]`, value));
    setText('[data-merch-value="color"]', color === 'black' ? copy.colorBlack : copy.colorWhite);
    setText('[data-merch-value="material"]', copy.material);
    setText('[data-merch-value="weight"]', copy.weight);
    setText('[data-merch-value="technique"]', copy.technique);
    setText('[data-merch-value="sizes"]', colors[color].sizes);
    card.querySelector('.merch-color-switch').setAttribute('aria-label', copy.colorGroup);
    track.setAttribute('aria-label', `${copy.photos} ${color === 'black' ? copy.black : copy.white} ${copy.title}`);
    card.querySelector('.rail-prev').setAttribute('aria-label', copy.previous);
    card.querySelector('.rail-next').setAttribute('aria-label', copy.next);
    track.querySelectorAll('.merch-photo-slide').forEach((slide, index) => {
      const image = slide.querySelector('img');
      image.alt = `${copy.title} — ${color === 'black' ? copy.black : copy.white}, ${copy.photo} ${index + 1}`;
    });
  };
  const createPhoto = (number) => {
    const path = `images/merch/dom/${color}/${String(number).padStart(2, '0')}`;
    const slide = document.createElement('div');
    slide.className = 'merch-photo-slide';
    const image = document.createElement('img');
    image.src = `${path}-600.webp`;
    image.srcset = `${path}-600.webp 600w, ${path}-1200.webp 1200w`;
    image.sizes = '(max-width: 672px) calc(100vw - 32px), 640px';
    image.loading = number === 1 ? 'eager' : 'lazy';
    image.decoding = 'async';
    slide.append(image);
    return slide;
  };
  carousel = window.CheshuyaCarousel.createCardCarousel(track);

  new IntersectionObserver(entries => {
    card.classList.toggle('merch-motion-visible', Boolean(entries[0]?.isIntersecting));
  }, {rootMargin: '100px', threshold: 0.1}).observe(card.querySelector('.merch-gallery'));

  card.querySelector('.rail-prev').addEventListener('click', () => carousel.move(-1));
  card.querySelector('.rail-next').addEventListener('click', () => carousel.move(1));
  card.querySelectorAll('[data-merch-select]').forEach(input => input.addEventListener('change', () => {
    if (!input.checked || input.dataset.merchSelect === color) return;
    carousel.destroy();
    color = input.dataset.merchSelect;
    card.dataset.merchColor = color;
    track.replaceChildren(...Array.from({length: colors[color].count}, (_, index) => createPhoto(index + 1)));
    track.scrollLeft = 0;
    carousel = window.CheshuyaCarousel.createCardCarousel(track);
    renderText();
  }));
  document.addEventListener('cheshuya:locale', event => {
    locale = event.detail === 'en' ? 'en' : 'ru';
    renderText();
  });
  renderText();
})();
