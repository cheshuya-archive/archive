(() => {
  const exhibitions = window.cheshuyaExhibitions || [];
  const id = new URLSearchParams(window.location.search).get('id');
  const currentIndex = exhibitions.findIndex((item) => item.id === id);
  const item = exhibitions[currentIndex];
  if (!item) return;

  let imageIndex = 0;
  const photo = document.querySelector('.zine-photo');
  const title = document.querySelector('.zine-info h1');
  const meta = document.querySelector('.zine-meta');
  const description = document.querySelector('.exhibition-place');
  const counter = document.querySelector('.counter');
  document.title = `${item.title} — Чешуя`;
  title.textContent = item.title;
  meta.textContent = `Выставка · ${item.year}`;
  description.textContent = item.description;

  const render = () => {
    const base = `images/${window.cheshuyaExhibitionBase(item, imageIndex + 1)}`;
    photo.src = `${base}-1200.webp`;
    photo.srcset = `${base}-600.webp 600w, ${base}-1200.webp 1200w, ${base}-2000.webp 2000w`;
    photo.sizes = '(max-width: 700px) 100vw, 55vw';
    photo.loading = imageIndex === 0 ? 'eager' : 'lazy';
    if (imageIndex === 0) photo.fetchPriority = 'high';
    else photo.removeAttribute('fetchpriority');
    photo.alt = `${item.title} — фото ${imageIndex + 1} из ${item.count}`;
    counter.textContent = `${imageIndex + 1} / ${item.count}`;
  };
  const move = (direction) => {
    imageIndex = (imageIndex + direction + item.count) % item.count;
    render();
  };
  document.querySelector('.prev')?.addEventListener('click', () => move(-1));
  document.querySelector('.next')?.addEventListener('click', () => move(1));

  let startX = 0;
  let startY = 0;
  const carousel = document.querySelector('.zine-carousel');
  carousel?.setAttribute('tabindex', '0');
  carousel?.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
  });
  carousel?.addEventListener('pointerdown', (event) => {
    startX = event.clientX;
    startY = event.clientY;
  });
  carousel?.addEventListener('pointerup', (event) => {
    if (event.target.closest('button')) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? -1 : 1);
  });

  const previous = exhibitions[(currentIndex + exhibitions.length - 1) % exhibitions.length];
  const next = exhibitions[(currentIndex + 1) % exhibitions.length];
  document.querySelector('.exhibition-prev').href = `exhibition.html?id=${previous.id}`;
  document.querySelector('.exhibition-next').href = `exhibition.html?id=${next.id}`;
  render();
})();
