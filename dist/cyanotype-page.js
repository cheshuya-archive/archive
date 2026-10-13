(() => {
  const images = ['media/DSCF3126-Recovered_1.png', 'media/6_(2).jpg', 'media/7_(2).jpg'];
  const photo = document.querySelector('.zine-photo');
  const counter = document.querySelector('.counter');
  const carousel = document.querySelector('.zine-carousel');
  const thumbnails = [...document.querySelectorAll('.cyanotype-thumbnails button')];
  let index = 0;

  const render = () => {
    photo.src = images[index];
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
})();
