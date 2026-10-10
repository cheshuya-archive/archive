(() => {
  const exhibitions = [
    { id: 'polya-prisutstviya', title: 'Поля присутствия', year: '2026', place: 'ДНИ, Москва', images: ['media/DSCF3126-Recovered_1.png'] },
    { id: 'uyazvimoe-mesto', title: 'Уязвимое место', year: '2026', place: 'KMSA, Казань', images: ['media/001_IMG_6172-HDR.jpg'] },
    { id: 'portal', title: 'Portal', year: '2024', place: 'Off-site show, Протвино', images: ['media/SAVE_20240924_153051.jpg'] },
    { id: 'black-show', title: 'Black show', year: '2024', place: 'Off-site show, Протвино', images: ['media/CHESHUYA_THE_NOSE_DIVE_PAPER_LASER_PRINTING_13X15_CM__2024_(2).jpg'] },
    { id: 'rusty-box', title: 'Rusty box', year: '2023', place: 'Off-site show, Алматы', images: ['media/001_IMG_6172-HDR.jpg'] },
    { id: 'sleepy-stupor', title: 'Sleeppy stupor', year: '2023', place: 'Off-site show, Алматы', images: ['media/DSCF3126-Recovered_1.png'] },
  ];
  const id = new URLSearchParams(window.location.search).get('id');
  const currentIndex = Math.max(0, exhibitions.findIndex((item) => item.id === id));
  const item = exhibitions[currentIndex];
  let imageIndex = 0;
  const photo = document.querySelector('.zine-photo');
  const title = document.querySelector('.zine-info h1');
  const meta = document.querySelector('.zine-meta');
  const place = document.querySelector('.exhibition-place');
  const counter = document.querySelector('.counter');
  document.title = `${item.title} — Чешуя`;
  title.textContent = item.title;
  meta.textContent = `Выставка · ${item.year}`;
  place.textContent = item.place;
  const render = () => {
    photo.src = item.images[imageIndex];
    photo.alt = item.title;
    counter.textContent = `${imageIndex + 1} / ${item.images.length}`;
  };
  const controls = document.querySelector('.zine-controls');
  if (item.images.length < 2) controls.hidden = true;
  document.querySelector('.prev')?.addEventListener('click', () => { imageIndex = (imageIndex + item.images.length - 1) % item.images.length; render(); });
  document.querySelector('.next')?.addEventListener('click', () => { imageIndex = (imageIndex + 1) % item.images.length; render(); });
  const previous = exhibitions[(currentIndex + exhibitions.length - 1) % exhibitions.length];
  const next = exhibitions[(currentIndex + 1) % exhibitions.length];
  const prevLink = document.querySelector('.exhibition-prev');
  const nextLink = document.querySelector('.exhibition-next');
  prevLink.href = `exhibition.html?id=${previous.id}`;
  nextLink.href = `exhibition.html?id=${next.id}`;
  render();
})();
