(() => {
  document.addEventListener('DOMContentLoaded', () => {
    const fallback = ['DSCF3126-Recovered_1', '6_(2)', '7_(2)'].map(name => ({
      src: `media/${name}.jpg`,
      srcset: `images/${name}-600.webp 600w, images/${name}-1200.webp 1200w, images/${name}-2000.webp 2000w`
    }));
    const images = window.CYANOTYPE_IMAGES || fallback;
    const photo = document.querySelector('.zine-photo');
    const counter = document.querySelector('.counter');
    const carousel = document.querySelector('.zine-carousel');
    const thumbnailsRoot = document.querySelector('.cyanotype-thumbnails');
    let index = 0;

    if (thumbnailsRoot && window.CYANOTYPE_IMAGES) {
      thumbnailsRoot.innerHTML = images.map((image, imageIndex) => `<button data-index="${imageIndex}" aria-label="Изображение ${imageIndex + 1}"><img alt="" src="${image.src}" srcset="${image.srcset}" sizes="160px" loading="lazy"></button>`).join('');
    }
    const thumbnails = [...document.querySelectorAll('.cyanotype-thumbnails button')];
    const render = () => {
      const image = images[index];
      photo.src = image.src;
      photo.srcset = image.srcset || '';
      photo.sizes = '(max-width: 700px) 100vw, 600px';
      counter.textContent = `${index + 1} / ${images.length}`;
      thumbnails.forEach((button, buttonIndex) => button.classList.toggle('is-active', buttonIndex === index));
    };
    const move = (direction) => { index = (index + direction + images.length) % images.length; render(); };
    document.querySelector('.prev')?.addEventListener('click', () => move(-1));
    document.querySelector('.next')?.addEventListener('click', () => move(1));
    thumbnails.forEach((button) => button.addEventListener('click', () => { index = Number(button.dataset.index); render(); }));
    let startX = 0, startY = 0;
    carousel?.addEventListener('pointerdown', (event) => { if (event.pointerType !== 'mouse') { startX = event.clientX; startY = event.clientY; } });
    carousel?.addEventListener('pointerup', (event) => { const dx = event.clientX - startX, dy = event.clientY - startY; if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? -1 : 1); });
    document.querySelector('.zine-language')?.addEventListener('click', (event) => { event.currentTarget.textContent = event.currentTarget.textContent === 'En' ? 'Ru' : 'En'; });
    render();
  });
})();
