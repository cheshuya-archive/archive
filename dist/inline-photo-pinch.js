// Keep a two-finger gesture on the photograph, not on the page viewport.
export function enableInlinePhotoPinch() {
  const selector = ".archive-image img, .catalog-image img, .zine-slide img, .cyanotype-sheet img, .object-slide-button img, .merch-photo-slide img";
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let gesture = null;
  let resetTimer = null;
  let suppressUntil = 0;
  let suppressImage = null;
  const distance = touches => Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
  const imageAt = target => {
    if (target instanceof HTMLImageElement && target.matches(selector)) return target;
    return target instanceof Element ? target.closest(".archive-image, .catalog-image, .zine-slide, .cyanotype-sheet, .object-slide-button, .merch-photo-slide")?.querySelector("img") : null;
  };
  const reset = () => {
    if (!gesture) return;
    const { image, transition, origin } = gesture;
    gesture = null;
    image.style.transition = motion.matches ? "none" : "scale .28s ease-out";
    image.style.scale = "1";
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      image.style.removeProperty("scale");
      image.style.transition = transition;
      image.style.transformOrigin = origin;
    }, motion.matches ? 0 : 300);
    suppressUntil = Date.now() + 450;
    suppressImage = image;
  };
  document.addEventListener("touchstart", event => {
    if (event.touches.length !== 2 || event.target.closest?.(".direct-photo-viewer")) return;
    const image = imageAt(event.target);
    if (!image) return;
    clearTimeout(resetTimer);
    const rect = image.getBoundingClientRect();
    const x = (event.touches[0].clientX + event.touches[1].clientX) / 2;
    const y = (event.touches[0].clientY + event.touches[1].clientY) / 2;
    gesture = { image, initial: Math.max(1, distance(event.touches)), transition: image.style.transition, origin: image.style.transformOrigin };
    image.style.transition = "none";
    image.style.transformOrigin = `${Math.max(0, Math.min(100, (x - rect.left) / rect.width * 100))}% ${Math.max(0, Math.min(100, (y - rect.top) / rect.height * 100))}%`;
    suppressImage = image;
    suppressUntil = Date.now() + 800;
    event.preventDefault();
  }, { passive: false });
  document.addEventListener("touchmove", event => {
    if (!gesture || event.touches.length < 2) return;
    event.preventDefault();
    gesture.image.style.scale = String(Math.max(1, Math.min(3, distance(event.touches) / gesture.initial)));
  }, { passive: false });
  document.addEventListener("touchend", event => {
    if (gesture && event.touches.length < 2) reset();
  }, { passive: true });
  document.addEventListener("touchcancel", reset, { passive: true });
  document.addEventListener("click", event => {
    if (Date.now() > suppressUntil || !suppressImage) return;
    if (event.target === suppressImage || event.target instanceof Element && event.target.contains(suppressImage)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
}
