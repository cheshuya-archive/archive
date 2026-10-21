(() => {
  const objects = [
    ...[['001', '18,5 × 25 см', 3], ['002', '26,5 × 35 см', 4], ['003', '18,5 × 22 см', 2], ['004', '18 × 25 см', 3]]
      .map(([number, size, count], index) => ({ id: `metal-${index + 1}`, material: 'metal', number, size, count })),
    ...[['001', '15 × 15 × 18 см', 2], ['002', '15 × 15 × 15 см', 2], ['003', '15 × 15 × 15 см', 2], ['004', '15 × 15 × 19 см', 2], ['005', '15 × 15 × 19 см', 1]]
      .map(([number, size, count], index) => ({ id: `ceramic-${index + 1}`, material: 'ceramic', number, size, count })),
  ];
  const id = new URLSearchParams(location.search).get('id');
  const currentIndex = objects.findIndex(object => object.id === id);
  if (currentIndex < 0) {
    location.replace('catalog-objects.html');
    return;
  }
  const object = objects[currentIndex];
  const heading = document.querySelector('.zine-info h1');
  const meta = document.querySelector('.zine-meta');
  const description = document.querySelector('.object-description');
  const renderCopy = locale => {
    const material = object.material === 'metal'
      ? (locale === 'en' ? 'Metal' : 'Металл')
      : (locale === 'en' ? 'Ceramics' : 'Керамика');
    heading.textContent = object.material === 'metal'
      ? `${locale === 'en' ? 'Untitled (from the Vodrov series)' : 'Без названия (из серии «Водровь»)'} ${object.number}`
      : `${material} ${object.number}`;
    const materialLink = document.getElementById('object-material-breadcrumb');
    if (materialLink) { materialLink.textContent = material; materialLink.href = `catalog-objects-${object.material}.html`; }
    meta.textContent = locale === 'en' ? `Object · ${material} · 2021` : `Объект · ${material} · 2021`;
    description.textContent = object.material === 'metal'
      ? `${object.size} · ${locale === 'en' ? 'metal coating on wood' : 'металлическое покрытие по дереву'}`
      : `${object.size} · ${locale === 'en' ? 'clay, glaze' : 'глина, глазурь'}`;
    document.title = `${heading.textContent} — Чешуя`;
  };
  document.addEventListener('cheshuya:locale', event => renderCopy(event.detail));
  renderCopy(window.CheshuyaLocale?.get() || 'ru');

  const images = Array.from({ length: object.count }, (_, index) => {
    const base = `images/objects/${object.material}/${object.number}/${String(index + 1).padStart(2, '0')}`;
    return { src: `${base}-1200.webp`, srcset: `${base}-600.webp 600w, ${base}-1200.webp 1200w, ${base}-2000.webp 2000w` };
  });
  const slide = document.querySelector('.zine-slide');
  const gallery = window.CheshuyaCarousel.mountImageGallery(slide, images, index => {
    document.querySelector('.counter').textContent = `${index + 1} / ${images.length}`;
  });
  slide.querySelectorAll('img').forEach((image, index) => {
    image.alt = `${heading.textContent} — фото ${index + 1} из ${images.length}`;
  });
  document.querySelector('.zine-controls').hidden = images.length < 2;
  document.querySelector('.prev').addEventListener('click', () => gallery?.move(-1));
  document.querySelector('.next').addEventListener('click', () => gallery?.move(1));
  document.querySelector('.zine-carousel').setAttribute('tabindex', '0');
  document.querySelector('.zine-header .back-icon').href = `catalog-objects-${object.material}.html`;
  const materialObjects = objects.filter(item => item.material === object.material);
  const materialIndex = materialObjects.findIndex(item => item.id === object.id);
  const previous = materialObjects[(materialIndex + materialObjects.length - 1) % materialObjects.length];
  const next = materialObjects[(materialIndex + 1) % materialObjects.length];
  document.querySelector('.object-prev').href = `object.html?id=${previous.id}`;
  document.querySelector('.object-next').href = `object.html?id=${next.id}`;
})();
