// The zoom viewer and gesture code load only when a photograph is opened.
const createPhotoLightbox = (options, createGallery) => {
  let viewer, pending;
  return {
    async open(index, trigger) {
      if (pending) return;
      trigger?.setAttribute("aria-busy", "true");
      try {
        pending = import("./photo-lightbox.js?v=ux-audit-1");
        const module = await pending;
        viewer ||= module.createPhotoLightbox(options, createGallery);
        viewer.open(index, trigger);
      } catch (error) {
        // A second click retries a transient network failure.
        console.error("Unable to open photo viewer", error);
      } finally {
        pending = null;
        trigger?.removeAttribute("aria-busy");
      }
    }
  };
};

const initialize = () => {
  const createGallery = window.CheshuyaCarousel?.createImageGallery;
  if (!createGallery) return;
  const sourceFrom = image => ({
    src: image.dataset.gallerySrc || image.dataset.src || image.getAttribute("src") || image.currentSrc,
    srcSet: image.dataset.gallerySrcset || image.dataset.srcset || image.getAttribute("srcset") || "",
    alt: image.alt,
  });
  const connect = (triggers, images, label, galleryId) => {
    if (!triggers.length || !images.length) return;
    const viewer = createPhotoLightbox({ images, label, galleryId }, createGallery);
    triggers.forEach((trigger, index) => trigger.addEventListener("click", () => viewer.open(index, trigger)));
    return viewer;
  };
  document.querySelectorAll(".zine-carousel").forEach(carousel => {
    const stage = carousel.querySelector(".zine-slide");
    const photos = [...(stage?.querySelectorAll("img") || [])];
    if (!stage || !photos.length) return;
    const zoom = document.createElement("button");
    zoom.type = "button";
    zoom.className = "gallery-zoom";
    zoom.setAttribute("aria-label", "Открыть изображение крупно");
    zoom.innerHTML = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></svg>';
    carousel.append(zoom);
    const viewer = createPhotoLightbox({
      images: photos.map(sourceFrom),
      label: document.querySelector(".zine-info h1")?.textContent || "Просмотр работ",
      originStage: stage,
      onClose: index => stage.dispatchEvent(new CustomEvent("gallery:select", { detail: index })),
    }, createGallery);
    const open = () => viewer.open(Math.max(0, photos.findIndex(photo => photo.dataset.active === "true")), zoom);
    zoom.addEventListener("click", open);
    stage.addEventListener("click", event => { if (event.target instanceof HTMLImageElement) open(); });
    stage.classList.add("can-enlarge");
  });
  const cyanotypeSlides = [...document.querySelectorAll("#cyanotype .cyanotype-slide")];
  const cyanotypeSources = cyanotypeSlides.map(slide => sourceFrom(slide.querySelector("img")));
  const cyanotypeTriggers = cyanotypeSlides.map((slide, index) => {
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "object-slide-button";
    trigger.setAttribute("aria-label", "Открыть цианотипию " + (index + 1));
    trigger.append(...slide.childNodes);
    slide.append(trigger);
    return trigger;
  });
  connect(cyanotypeTriggers, cyanotypeSources, "Просмотр цианотипий", "home:cyanotype");
  const objectTriggers = [...document.querySelectorAll("[data-object-index]")];
  connect(objectTriggers, objectTriggers.map(button => sourceFrom(button.querySelector("img"))), "Просмотр объектов", "home:objects");

  const drawings = [...document.querySelectorAll("#drawings .archive-card:not([data-drawing-category]), .catalog-page.art-catalog:not(.drawing-catalog):not(:has([data-object-index])) .catalog-card")];
  const drawingSources = drawings.map(card => sourceFrom(card.querySelector("img")));
  const drawingTriggers = drawings.map((card,index) => {
    const existing = card.querySelector(".archive-card-link");
    const trigger = document.createElement("button");
    trigger.className = "artwork-trigger " + (existing ? "archive-card-link" : "catalog-card-link");
    trigger.type = "button";
    trigger.setAttribute("aria-label", "Открыть рисунок " + (index + 1));
    if (existing) { trigger.append(...existing.childNodes); existing.replaceWith(trigger); }
    else { trigger.append(...card.childNodes); card.append(trigger); }
    return trigger;
  });
  connect(drawingTriggers, drawingSources, "Просмотр рисунков", "home:drawings");
};
if (document.readyState === "complete") initialize();
else document.addEventListener("DOMContentLoaded", () => setTimeout(initialize, 0), { once: true });
