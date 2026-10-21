(() => {
  const render = locale => {
    const english = locale === 'en';
    document.querySelectorAll('[data-material-heading]').forEach(heading => {
      heading.textContent = heading.dataset.materialHeading === 'metal'
        ? (english ? 'Metal' : 'Металл')
        : (english ? 'Ceramics' : 'Керамика');
    });
    document.querySelectorAll('[data-object-label]').forEach(label => {
      const [material, number] = label.dataset.objectLabel.split('-');
      const padded = number.padStart(3, '0');
      label.textContent = padded;
      let details = label.parentElement.querySelector('.object-specs');
      if (!details) {
        details = document.createElement('span');
        details.className = 'object-specs';
        label.after(details);
      }
      details.textContent = '2021';
      const image = label.closest('.catalog-card')?.querySelector('img');
      if (image) {
        const base = `images/objects/${material}/${padded}/01`;
        image.src = `${base}-600.webp`;
        image.srcset = `${base}-600.webp 600w, ${base}-1200.webp 1200w, ${base}-2000.webp 2000w`;
        image.alt = material === 'metal'
          ? `${english ? 'Metal object' : 'Объект из металла'} ${padded}`
          : `${english ? 'Ceramic object' : 'Керамический объект'} ${padded}`;
      }
    });
  };
  document.addEventListener('cheshuya:locale', event => render(event.detail));
  render(window.CheshuyaLocale?.get() || 'ru');
})();
