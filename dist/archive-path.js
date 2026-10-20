// A lightweight, stable navigation target during each typewriter word.
const routes = ["catalog-exhibitions.html", "catalog-merch.html", "cyanotype.html", "catalog-prints.html", "catalog-objects.html", "catalog-drawings.html"];
const copy = {
  ru: {
    prefix: "чешуя\\архив\\",
    words: ["выставки", "мерч", "цианотипия", "зины", "объекты", "графика"],
    description: "Чешуя — архив: выставки, мерч, цианотипия, зины, объекты и графика.",
    open: "Открыть раздел", empty: "Чешуя — архив",
  },
  en: {
    prefix: "cheshuya\\archive\\",
    words: ["exhibitions", "merch", "cyanotype", "zines", "objects", "graphics"],
    description: "Cheshuya archive: exhibitions, merch, cyanotype, zines, objects and graphics.",
    open: "Open section", empty: "Cheshuya archive",
  },
};
export function mountArchivePath(root, initialLocale = "ru", options = {}) {
  if (!root) return () => {};
  const prefix = root.querySelector("[data-path-prefix]");
  const word = root.querySelector("[data-path-word]");
  const description = root.querySelector("[data-path-description]");
  const link = root.querySelector("[data-path-link]");
  if (!prefix || !word || !description || !link) return () => {};
  const targets = options.routes || routes;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let locale = initialLocale === "en" ? "en" : "ru";
  let index = 0, length = 0, phase = "blank", timer = null;
  let visible = false, destroyed = false, hovering = false, focused = false, holding = false;
  let pointerBlocked = false;
  const interested = () => hovering || focused || holding;
  const running = () => !destroyed && visible && !document.hidden && !motion.matches && !(length > 0 && interested());
  const controls = () => {
    root.classList.toggle("is-running", running());
    if (length > 0) {
      const target = targets[index];
      if (link.getAttribute("href") !== target) link.setAttribute("href", target);
      link.removeAttribute("aria-disabled");
      link.removeAttribute("tabindex");
      const label = copy[locale].prefix + copy[locale].words[index] + " — " + copy[locale].open;
      if (link.getAttribute("aria-label") !== label) link.setAttribute("aria-label", label);
    } else {
      link.removeAttribute("href");
      link.setAttribute("aria-disabled", "true");
      link.setAttribute("tabindex", "-1");
      link.setAttribute("aria-label", copy[locale].empty);
    }
  };
  const cancel = () => { clearTimeout(timer); timer = null; };
  const schedule = delay => {
    cancel();
    controls();
    if (running()) timer = setTimeout(step, delay);
  };
  const completeWord = () => {
    if (!length) return;
    const text = copy[locale].words[index];
    word.textContent = text;
    length = Array.from(text).length;
    phase = "hold";
  };
  function step() {
    timer = null;
    if (!running()) return controls();
    const letters = Array.from(copy[locale].words[index]);
    if (phase === "blank") phase = "typing";
    if (phase === "typing") {
      length = interested() ? letters.length : length + 1;
      word.textContent = letters.slice(0, length).join("");
      if (length >= letters.length) { phase = "hold"; schedule(1600); }
      else schedule(90);
    } else if (phase === "hold") {
      phase = "deleting";
      schedule(70);
    } else {
      length = Math.max(0, length - 1);
      word.textContent = letters.slice(0, length).join("");
      if (!length) {
        index = (index + 1) % copy[locale].words.length;
        phase = "blank";
        schedule(750);
      } else schedule(55);
    }
  }
  const setLocale = next => {
    const keepTarget = length > 0 && interested();
    locale = next === "en" ? "en" : "ru";
    if (!keepTarget) index = 0;
    length = motion.matches || keepTarget ? Array.from(copy[locale].words[index]).length : 0;
    phase = length ? "hold" : "blank";
    prefix.textContent = copy[locale].prefix;
    description.textContent = copy[locale].description;
    word.textContent = length ? copy[locale].words[index] : "";
    schedule(900);
  };
  const onLocale = event => setLocale(event.detail);
  const onVisibility = () => {
    if (document.hidden) holding = false;
    schedule(phase === "blank" ? 750 : 100);
  };
  const onMotion = () => setLocale(locale);
  const onEnter = event => {
    if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
    hovering = true; completeWord(); schedule(1600);
  };
  const onLeave = () => { hovering = false; schedule(1600); };
  const onFocus = () => { focused = true; completeWord(); schedule(1600); };
  const onBlur = () => { focused = false; schedule(1600); };
  const onDown = () => {
    pointerBlocked = !link.hasAttribute("href");
    holding = true; completeWord(); schedule(1600);
  };
  const onUp = () => {
    if (!holding) return;
    holding = false; schedule(1600);
  };
  const onCancel = () => { pointerBlocked = false; onUp(); };
  const onClick = event => {
    // Native anchors preserve Enter, modifiers and opening in a new tab.
    if (!link.hasAttribute("href") || (event.detail > 0 && pointerBlocked)) event.preventDefault();
    pointerBlocked = false;
  };
  const bounds = root.getBoundingClientRect();
  visible = bounds.bottom > 0 && bounds.top < innerHeight;
  const observer = new IntersectionObserver(entries => {
    const next = entries.some(entry => entry.isIntersecting);
    if (next === visible) return;
    visible = next; onVisibility();
  }, { threshold: 0.1 });
  observer.observe(root);
  const events = [["pointerenter",onEnter],["pointerleave",onLeave],["focus",onFocus],["blur",onBlur],["pointerdown",onDown],["click",onClick]];
  events.forEach(([type,handler]) => link.addEventListener(type,handler));
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onCancel);
  document.addEventListener("visibilitychange", onVisibility);
  document.addEventListener("cheshuya:locale", onLocale);
  motion.addEventListener("change", onMotion);
  setLocale(locale);
  return () => {
    destroyed = true; cancel(); observer.disconnect();
    events.forEach(([type,handler]) => link.removeEventListener(type,handler));
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onCancel);
    document.removeEventListener("visibilitychange", onVisibility);
    document.removeEventListener("cheshuya:locale", onLocale);
    motion.removeEventListener("change", onMotion);
    root.classList.remove("is-running");
  };
}
