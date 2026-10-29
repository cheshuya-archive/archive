// Paint a temporary copy above clipped carousel rails while two fingers pinch a photo.
export function enableInlinePhotoPinch() {
  const selector = ".archive-image img, .catalog-image img, .zine-slide img, .cyanotype-sheet img, .object-slide-button img, .merch-photo-slide img";
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const distance = touches => Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
  const center = touches => ({
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2,
  });
  const imageAt = target => {
    if (target instanceof HTMLImageElement && target.matches(selector)) return target;
    return target instanceof Element ? target.closest(".archive-image, .catalog-image, .zine-slide, .cyanotype-sheet, .object-slide-button, .merch-photo-slide")?.querySelector("img") : null;
  };
  let gesture = null;
  let overlay = null;
  let cleanupTimer = null;
  let suppressUntil = 0;
  let suppressImage = null;
  const removeOverlay = () => {
    clearTimeout(cleanupTimer);
    overlay?.remove();
    overlay = null;
  };
  const reset = () => {
    if (!gesture) return;
    const { image, copy } = gesture;
    gesture = null;
    suppressUntil = Date.now() + 450;
    suppressImage = image;
    if (motion.matches) removeOverlay();
    else {
      copy.style.transition = "transform .28s ease-out";
      copy.style.transform = "none";
      cleanupTimer = setTimeout(removeOverlay, 300);
    }
  };
  document.addEventListener("touchstart", event => {
    if (event.touches.length !== 2 || event.target.closest?.(".direct-photo-viewer")) return;
    const image = imageAt(event.target);
    if (!image) return;
    removeOverlay();
    const rect = image.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const style = getComputedStyle(image);
    const midpoint = center(event.touches);
    const copy = new Image();
    copy.src = image.currentSrc || image.src;
    copy.alt = "";
    Object.assign(copy.style, {
      position: "fixed", left: `${rect.left}px`, top: `${rect.top}px`,
      width: `${rect.width}px`, height: `${rect.height}px`,
      maxWidth: "none", maxHeight: "none", margin: "0", padding: "0",
      objectFit: style.objectFit, objectPosition: style.objectPosition,
      borderRadius: style.borderRadius, filter: style.filter,
      transformOrigin: `${midpoint.x - rect.left}px ${midpoint.y - rect.top}px`,
      pointerEvents: "none", userSelect: "none", touchAction: "none",
      zIndex: "1000", willChange: "transform", background: "transparent",
    });
    copy.setAttribute("aria-hidden", "true");
    document.body.append(copy);
    overlay = copy;
    gesture = { image, copy, midpoint, initial: Math.max(1, distance(event.touches)) };
    suppressImage = image;
    suppressUntil = Date.now() + 800;
    event.preventDefault();
  }, { passive: false });
  document.addEventListener("touchmove", event => {
    if (!gesture || event.touches.length < 2) return;
    event.preventDefault();
    const midpoint = center(event.touches);
    const scale = Math.max(1, Math.min(3, distance(event.touches) / gesture.initial));
    gesture.copy.style.transform = `translate3d(${midpoint.x - gesture.midpoint.x}px, ${midpoint.y - gesture.midpoint.y}px, 0) scale(${scale})`;
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
