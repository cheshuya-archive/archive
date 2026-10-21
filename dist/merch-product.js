(() => {
  const page = document.querySelector('.merch-product-page');
  if (!page) return;
  const color = page.dataset.color;
  const count = color === 'white' ? 2 : 3;
  const images = Array.from({ length: count }, (_, index) => {
    const base = `images/merch/dom/${color}/${String(index + 1).padStart(2, '0')}`;
    return { src: `${base}-1200.webp`, srcset: `${base}-600.webp 600w, ${base}-1200.webp 1200w` };
  });
  const stage = page.querySelector('.zine-slide');
  const gallery = window.CheshuyaCarousel.mountImageGallery(stage, images, index => {
    page.querySelector('.counter').textContent = `${index + 1} / ${count}`;
  });
  const carousel = page.querySelector('.zine-carousel');
  carousel.tabIndex = 0;
  page.querySelector('.prev').addEventListener('click', () => gallery?.move(-1));
  page.querySelector('.next').addEventListener('click', () => gallery?.move(1));

  const render = locale => {
    const english = locale === 'en';
    const shade = color === 'white' ? (english ? 'white' : 'белая') : (english ? 'black' : 'чёрная');
    const title = english ? 'Home T-shirt' : 'Футболка «Дом»';
    page.querySelector('[data-product-title]').textContent = title;
    page.querySelector('[data-product-meta]').textContent = english ? 'T-shirt · Screen printing' : 'Футболка · Шелкография';
    page.querySelector('[data-product-description]').textContent = english
      ? 'The print refers to a street work made in Kazan in 2020.'
      : 'Принт отсылает к уличной работе 2020 года, сделанной в Казани.';
    const words = english
      ? { color: ['Colour', color === 'white' ? 'White' : 'Black'], material: ['Material', '100% cotton'], weight: ['Fabric weight', '180 g/m²'], technique: ['Technique', 'Screen printing'] }
      : { color: ['Цвет', color === 'white' ? 'Белый' : 'Чёрный'], material: ['Материал', '100% хлопок'], weight: ['Плотность ткани', '180 г/м²'], technique: ['Техника', 'Шелкография'] };
    for (const [key, [label, value]] of Object.entries(words)) {
      page.querySelector(`[data-spec-label="${key}"]`).textContent = label;
      page.querySelector(`[data-spec-value="${key}"]`).textContent = value;
    }
    page.querySelector('[data-sizes-heading]').textContent = english ? 'Sizes' : 'Размеры';
    page.querySelector('.zine-pagination').setAttribute('aria-label', english ? 'Other T-shirts' : 'Другие футболки');
    page.querySelector('.merch-prev,.merch-next').setAttribute('aria-label', english
      ? (color === 'white' ? 'Next T-shirt' : 'Previous T-shirt')
      : (color === 'white' ? 'Следующая футболка' : 'Предыдущая футболка'));
    carousel.setAttribute('aria-label', english ? 'T-shirt photo gallery' : 'Фотографии футболки');
    page.querySelector('.prev').setAttribute('aria-label', english ? 'Previous image' : 'Предыдущее фото');
    page.querySelector('.next').setAttribute('aria-label', english ? 'Next image' : 'Следующее фото');
    stage.querySelectorAll('img').forEach((image, index) => {
      image.alt = `${title}, ${shade} — ${english ? 'photo' : 'фото'} ${index + 1} ${english ? 'of' : 'из'} ${count}`;
    });
    document.title = `${title} — Чешуя`;
  };
  document.addEventListener('cheshuya:locale', event => render(event.detail));
  render(window.CheshuyaLocale?.get() || 'ru');
})();
