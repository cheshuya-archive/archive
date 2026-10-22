(() => {
  const images = [...document.querySelectorAll('img[data-src]')];
  if (!images.length) return;
  const activate = image => {
    if (!image.dataset.src) return;
    if (image.dataset.srcset) image.srcset = image.dataset.srcset;
    image.src = image.dataset.src;
    delete image.dataset.src;
    delete image.dataset.srcset;
  };
  if (!('IntersectionObserver' in window)) {
    images.forEach(activate);
    return;
  }
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      activate(entry.target);
    }
  }, { rootMargin: '300px' });
  images.forEach(image => observer.observe(image));
})();
