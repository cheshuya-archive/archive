// Shared by the static site and Next.js; no work runs between scroll events.
export function mountBackToTop() {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "back-to-top";
  button.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 12 6-6 6 6M12 6v12"/></svg>';
  document.body.append(button);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let frame = null;
  const updateLabel = () => {
    const label = document.documentElement.lang === "en" ? "Back to top" : "Наверх";
    button.setAttribute("aria-label", label);
    button.title = label;
  };
  const render = () => {
    frame = null;
    const visible = scrollY >= Math.max(800, innerHeight * 1.5);
    button.classList.toggle("is-visible", visible);
    button.tabIndex = visible ? 0 : -1;
    button.setAttribute("aria-hidden", String(!visible));
  };
  const schedule = () => { if (frame === null) frame = requestAnimationFrame(render); };
  const goToTop = () => {
    // Move keyboard focus to the destination before the floating control disappears.
    document.querySelector("header button, header a[href], header [tabindex='0']")?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: reduced.matches ? "instant" : "smooth" });
  };
  button.addEventListener("click", goToTop);
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", schedule);
  addEventListener("pageshow", schedule);
  document.addEventListener("cheshuya:locale", updateLabel);
  updateLabel();
  render();
  return () => {
    if (frame !== null) cancelAnimationFrame(frame);
    removeEventListener("scroll", schedule);
    removeEventListener("resize", schedule);
    removeEventListener("pageshow", schedule);
    document.removeEventListener("cheshuya:locale", updateLabel);
    button.removeEventListener("click", goToTop);
    button.remove();
  };
}
