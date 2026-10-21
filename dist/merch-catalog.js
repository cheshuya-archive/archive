(() => {
  const render = locale => {
    const english = locale === 'en';
    document.querySelectorAll('[data-merch-title]').forEach(title => {
      const white = title.dataset.merchTitle === 'white';
      title.textContent = english
        ? `Home T-shirt — ${white ? 'white' : 'black'}`
        : `Футболка «Дом» — ${white ? 'белая' : 'чёрная'}`;
      title.closest('.catalog-card').querySelector('img').alt = title.textContent;
    });
  };
  document.addEventListener('cheshuya:locale', event => render(event.detail));
  render(window.CheshuyaLocale?.get() || 'ru');
})();
