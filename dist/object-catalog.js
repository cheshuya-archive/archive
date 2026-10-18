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
      label.textContent = `${material === 'metal' ? (english ? 'Metal' : 'Металл') : (english ? 'Ceramics' : 'Керамика')} ${english ? '#' : '№'} ${number}`;
    });
  };
  document.addEventListener('cheshuya:locale', event => render(event.detail));
  render(window.CheshuyaLocale?.get() || 'ru');
})();
