// The larger photograph loads only when the visitor opens one.
const createPhotoViewer = options => {
  let viewer, pending;
  return {
    async open(index, trigger) {
      if (pending) return;
      trigger?.setAttribute("aria-busy", "true");
      try {
        pending = import("./photo-expand.js?v=direct-expand-3");
        const module = await pending;
        viewer ||= module.createPhotoExpand(options);
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
  const sourceFrom = image => ({
    src: image.dataset.gallerySrc || image.dataset.src || image.getAttribute("src") || image.currentSrc,
    srcSet: image.dataset.gallerySrcset || image.dataset.srcset || image.getAttribute("srcset") || "",
    alt: image.alt,
  });
  const connect = (triggers, images, label, galleryId) => {
    if (!triggers.length || !images.length) return;
    const rail = triggers[0].closest(".rail-scroll");
    const viewer = createPhotoViewer({
      images, label, galleryId,
      origins: triggers.map(trigger => trigger.querySelector("img")),
      onBeforeClose: index => {
        const item = triggers[index]?.closest(".cyanotype-slide, .archive-card");
        if (!rail || !item) return;
        rail.setAttribute("data-animating", "");
        rail.scrollLeft = item.offsetLeft - rail.firstElementChild.offsetLeft;
        requestAnimationFrame(() => rail.removeAttribute("data-animating"));
      },
    });
    triggers.forEach((trigger, index) => trigger.addEventListener("click", () => viewer.open(index, trigger)));
    return viewer;
  };
  document.querySelectorAll(".zine-carousel").forEach(carousel => {
    const stage = carousel.querySelector(".zine-slide");
    const photos = [...(stage?.querySelectorAll("img") || [])];
    if (!stage || !photos.length) return;
    const viewer = createPhotoViewer({
      images: photos.map(sourceFrom),
      origins: photos,
      label: document.querySelector(".zine-info h1")?.textContent || "Просмотр работ",
      originStage: stage,
      onBeforeClose: index => {
        stage.setAttribute("data-animating", "");
        stage.scrollLeft = photos[index].offsetLeft - photos[0].offsetLeft;
        requestAnimationFrame(() => stage.removeAttribute("data-animating"));
      },
      onClose: index => stage.dispatchEvent(new CustomEvent("gallery:select", { detail: index })),
    });
    stage.addEventListener("click", event => {
      if (!(event.target instanceof HTMLImageElement)) return;
      viewer.open(Math.max(0, photos.indexOf(event.target)), event.target);
    });
    stage.classList.add("can-enlarge");
  });
  const cyanotypeSlides = [...document.querySelectorAll("#cyanotype .cyanotype-slide")];
  const cyanotypeSources = cyanotypeSlides.map(slide => sourceFrom(slide.querySelector("img")));
  const cyanotypeTriggers = cyanotypeSlides.map((slide, index) => {
    const image = slide.querySelector("img");
    const sheet = document.createElement("div");
    sheet.className = "cyanotype-sheet";
    image.replaceWith(sheet);
    sheet.append(image);
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "cyanotype-expand";
    trigger.setAttribute("aria-label", "Увеличить цианотипию " + (index + 1));
    sheet.replaceWith(trigger);
    trigger.append(sheet);
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
