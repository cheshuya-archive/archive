(() => {
  document.addEventListener('DOMContentLoaded', () => {
  let index = 0;
  const images = window.ZINE_IMAGES || [];
  const photo = document.querySelector('.zine-photo');
  const counter = document.querySelector('.counter');
  const carousel = document.querySelector('.zine-carousel');
  const render = () => {
    const image = images[index];
    photo.src = typeof image === 'string' ? image : image.src;
    if (typeof image !== 'string' && image.srcset) {
      photo.srcset = image.srcset;
      photo.sizes = '(max-width: 700px) 100vw, 600px';
    } else photo.removeAttribute('srcset');
    counter.textContent = `${index + 1} / ${images.length}`;
  };
  const previous = () => { index = (index + images.length - 1) % images.length; render(); };
  const next = () => { index = (index + 1) % images.length; render(); };
  document.querySelector('.prev')?.addEventListener('click', previous);
  document.querySelector('.next')?.addEventListener('click', next);
  carousel?.setAttribute('tabindex', '0');
  carousel?.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); previous(); }
    if (event.key === 'ArrowRight') { event.preventDefault(); next(); }
  });
  let startX = 0, startY = 0;
  carousel?.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse') { startX = event.clientX; startY = event.clientY; }
  });
  carousel?.addEventListener('pointerup', (event) => {
    const dx = event.clientX - startX, dy = event.clientY - startY;
    if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy)) dx > 0 ? previous() : next();
  });
  document.querySelector('.zine-language')?.addEventListener('click', (event) => {
    event.currentTarget.textContent = event.currentTarget.textContent === 'En' ? 'Ru' : 'En';
  });
  document.querySelector('.zine-burger')?.addEventListener('click', () => location.href = 'index.html');
  });
})();
