(() => {
  const objects = [
    ...[1, 2, 3, 4].map(number => ({ id: `metal-${number}`, material: 'metal', number, photos: [`${number}`] })),
    ...[1, 2, 3, 4, 5].map(number => ({
      id: `ceramic-${number}`, material: 'ceramic', number,
      photos: number === 5 ? ['5.1'] : [`${number}.1`, `${number}.2`],
    })),
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
  const renderCopy = locale => {
    const material = object.material === 'metal'
      ? (locale === 'en' ? 'Metal' : 'Металл')
      : (locale === 'en' ? 'Ceramics' : 'Керамика');
    heading.textContent = `${material} ${locale === 'en' ? '#' : '№'} ${object.number}`;
    meta.textContent = locale === 'en' ? `Object · ${material}` : `Объект · ${material}`;
    document.title = `${heading.textContent} — Чешуя`;
  };
  document.addEventListener('cheshuya:locale', event => renderCopy(event.detail));
  renderCopy(window.CheshuyaLocale?.get() || 'ru');

  const images = object.photos.map(photo => {
    const base = `images/objects/${object.material}/${photo}`;
    const largeWidth = object.material === 'metal' ? 1024 : 2000;
    return {
      src: `${base}-1200.webp`,
      srcset: object.material === 'metal'
        ? `${base}-600.webp 600w, ${base}-1200.webp ${largeWidth}w`
        : `${base}-600.webp 600w, ${base}-1200.webp 1200w, ${base}-2000.webp 2000w`,
    };
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
  const previous = objects[(currentIndex + objects.length - 1) % objects.length];
  const next = objects[(currentIndex + 1) % objects.length];
  document.querySelector('.object-prev').href = `object.html?id=${previous.id}`;
  document.querySelector('.object-next').href = `object.html?id=${next.id}`;
})();
