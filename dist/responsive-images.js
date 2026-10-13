(() => {
  const widths = [600, 1200, 2000];
  const supported = /\.(avif|jpe?g|png|tiff?|webp)$/i;

  const paths = (source) => {
    const clean = decodeURIComponent(source.replace(/^media\//, "")).replace(/\.[^.]+$/, "");
    const name = clean.split("/").map(encodeURIComponent).join("/");
    return widths.map((width) => `images/${name}-${width}.webp ${width}w`).join(", ");
  };

  const apply = (image) => {
    const source = image.getAttribute("src");
    if (!source || !source.startsWith("media/") || !supported.test(source) || image.dataset.responsive) return;
    image.dataset.responsive = "true";
    image.srcset = paths(source);
    image.sizes = "(max-width: 700px) 100vw, 600px";
    if (image.closest(".logo-stage, .header-logo, .street-feature")) {
      image.loading = "eager";
      image.fetchPriority = "high";
    } else {
      image.loading = "lazy";
    }
  };

  const applyAll = (root = document) => root.querySelectorAll?.("img").forEach(apply);
  applyAll();
  new MutationObserver((records) => records.forEach((record) => record.addedNodes.forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    if (node.matches?.("img")) apply(node);
    applyAll(node);
  }))).observe(document.documentElement, { childList: true, subtree: true });
})();
