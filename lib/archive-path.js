// A small, pausable path caption shared by the React and static versions.
const copy = {
  ru: {
    prefix: "чешуя\\архив\\",
    words: ["выставки", "мерч", "цианотипия", "зины", "объекты", "рисунки"],
    description: "Чешуя — архив: выставки, мерч, цианотипия, зины, объекты и рисунки.",
    pause: "Приостановить печать подписи", resume: "Продолжить печать подписи",
    static: "Разделы архива Чешуи",
  },
  en: {
    prefix: "cheshuya\\archive\\",
    words: ["exhibitions", "merch", "cyanotype", "zines", "objects", "drawings"],
    description: "Cheshuya archive: exhibitions, merch, cyanotype, zines, objects and drawings.",
    pause: "Pause caption typing", resume: "Resume caption typing",
    static: "Cheshuya archive sections",
  },
};
export function mountArchivePath(root, initialLocale = "ru") {
  if (!root) return () => {};
  const prefix = root.querySelector("[data-path-prefix]");
  const word = root.querySelector("[data-path-word]");
  const description = root.querySelector("[data-path-description]");
  const button = root.querySelector("button");
  if (!prefix || !word || !description || !button) return () => {};
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let locale = initialLocale === "en" ? "en" : "ru";
  let index = 0, length = 0, phase = "blank", timer = null;
  let paused = false, visible = false, destroyed = false;
  const running = () => !destroyed && visible && !document.hidden && !paused && !motion.matches;
  const controls = () => {
    root.classList.toggle("is-running", running());
    button.disabled = motion.matches;
    button.setAttribute("aria-pressed", String(paused));
    button.setAttribute("aria-label", motion.matches ? copy[locale].static : paused ? copy[locale].resume : copy[locale].pause);
  };
  const cancel = () => { clearTimeout(timer); timer = null; };
  const schedule = delay => {
    cancel();
    controls();
    if (running()) timer = setTimeout(step, delay);
  };
  function step() {
    timer = null;
    if (!running()) return controls();
    const letters = Array.from(copy[locale].words[index]);
    if (phase === "blank") phase = "typing";
    if (phase === "typing") {
      length++;
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
    locale = next === "en" ? "en" : "ru";
    index = length = 0;
    phase = "blank";
    prefix.textContent = copy[locale].prefix;
    description.textContent = copy[locale].description;
    word.textContent = motion.matches ? copy[locale].words[0] : "";
    schedule(900);
  };
  const onLocale = event => setLocale(event.detail);
  const onVisibility = () => schedule(phase === "blank" ? 750 : 100);
  const onMotion = () => setLocale(locale);
  const onToggle = () => { paused = !paused; schedule(120); };
  const bounds = root.getBoundingClientRect();
  visible = bounds.bottom > 0 && bounds.top < innerHeight;
  const observer = new IntersectionObserver(entries => {
    const next = entries.some(entry => entry.isIntersecting);
    if (next === visible) return;
    visible = next;
    onVisibility();
  }, { threshold: 0.1 });
  observer.observe(root);
  button.addEventListener("click", onToggle);
  document.addEventListener("visibilitychange", onVisibility);
  document.addEventListener("cheshuya:locale", onLocale);
  motion.addEventListener("change", onMotion);
  setLocale(locale);
  return () => {
    destroyed = true;
    cancel();
    observer.disconnect();
    button.removeEventListener("click", onToggle);
    document.removeEventListener("visibilitychange", onVisibility);
    document.removeEventListener("cheshuya:locale", onLocale);
    motion.removeEventListener("change", onMotion);
    root.classList.remove("is-running");
  };
}
