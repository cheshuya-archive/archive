(() => {
  const header = document.querySelector('.analytics-privacy nav');
  if (!header) return;
  let previousScroll = Math.max(0, scrollY);
  let direction = 0;
  let distance = 0;
  let frame = null;
  const update = () => {
    frame = null;
    const current = Math.max(0, scrollY);
    const next = Math.sign(current - previousScroll);
    if (next) {
      distance = next === direction ? distance + Math.abs(current - previousScroll) : Math.abs(current - previousScroll);
      direction = next;
    }
    if (current < 80 || (direction < 0 && distance > 8)) header.classList.remove('site-header-hidden');
    else if (current > 120 && direction > 0 && distance > 8) header.classList.add('site-header-hidden');
    previousScroll = current;
  };
  addEventListener('scroll', () => {
    if (frame === null) frame = requestAnimationFrame(update);
  }, { passive: true });
})();
