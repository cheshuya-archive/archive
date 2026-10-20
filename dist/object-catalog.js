(() => {
  const render = locale => {
    const english = locale === 'en';
    const sizes = {
      metal: ['18,5 × 25 см', '26,5 × 35 см', '18,5 × 22 см', '18 × 25 см'],
      ceramic: ['15 × 15 × 18 см', '15 × 15 × 15 см', '15 × 15 × 15 см', '15 × 15 × 19 см', '15 × 15 × 19 см'],
    };
    document.querySelectorAll('[data-material-heading]').forEach(heading => {
      heading.textContent = heading.dataset.materialHeading === 'metal'
        ? (english ? 'Metal' : 'Металл')
        : (english ? 'Ceramics' : 'Керамика');
    });
    document.querySelectorAll('[data-object-label]').forEach(label => {
      const [material, number] = label.dataset.objectLabel.split('-');
      const padded = number.padStart(3, '0');
      label.textContent = material === 'metal'
        ? `${english ? 'Untitled (from the Vodrov series)' : 'Без названия (из серии «Водровь»)'} ${padded}`
        : `${english ? 'Ceramics' : 'Керамика'} ${padded}`;
      let details = label.parentElement.querySelector('.object-specs');
      if (!details) {
        details = document.createElement('span');
        details.className = 'object-specs';
        label.after(details);
      }
      details.textContent = material === 'metal'
        ? `${sizes.metal[Number(number) - 1]} · ${english ? 'metal coating on wood' : 'металлическое покрытие по дереву'}`
        : `${sizes.ceramic[Number(number) - 1]} · ${english ? 'clay, glaze · 2021' : 'глина, глазурь · 2021'}`;
      const image = label.closest('.catalog-card')?.querySelector('img');
      if (image) {
        const base = `images/objects/${material}/${padded}/01`;
        image.src = `${base}-600.webp`;
        image.srcset = `${base}-600.webp 600w, ${base}-1200.webp 1200w, ${base}-2000.webp 2000w`;
        image.alt = label.textContent;
      }
    });
  };
  document.addEventListener('cheshuya:locale', event => render(event.detail));
  render(window.CheshuyaLocale?.get() || 'ru');
})();
