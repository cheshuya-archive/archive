/**
 * Shared native-dialog viewer for the React app and the published static pages.
 * Image requests start only after opening, with responsive sizes for the large stage.
 */
export function createPhotoLightbox(options, createGallery) {
  const sources = options.images;
  const dialog = document.createElement("dialog");
  dialog.className = "object-lightbox photo-lightbox";
  dialog.setAttribute("aria-label", options.label || "Просмотр фотографий");
  dialog.innerHTML = '<button class="object-lightbox-close" type="button" aria-label="Закрыть">×</button><div class="object-lightbox-view"><div class="zine-slide lightbox-stage"></div><div class="zine-controls lightbox-controls"><button class="object-lightbox-prev" type="button" aria-label="Предыдущее фото">←</button><button class="object-lightbox-next" type="button" aria-label="Следующее фото">→</button></div><span class="lightbox-loading" role="status" aria-live="polite"></span></div><span class="object-lightbox-counter gallery-counter" role="status" aria-live="polite"></span>';
  const stage = dialog.querySelector(".lightbox-stage");
  const counter = dialog.querySelector(".object-lightbox-counter");
  const status = dialog.querySelector(".lightbox-loading");
  let gallery = null, active = 0, opener = null, overflow = "", destroyed = false;
  let openVersion = 0;
  const release = () => {
    openVersion++;
    gallery?.destroy();
    gallery = null;
    document.body.style.overflow = overflow;
    status.textContent = "";
    dialog.remove();
    if (!destroyed) {
      options.onClose?.(active);
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    }
  };
  dialog.querySelector(".object-lightbox-close").addEventListener("click", () => dialog.close());
  dialog.querySelector(".object-lightbox-prev").addEventListener("click", () => gallery?.move(-1));
  dialog.querySelector(".object-lightbox-next").addEventListener("click", () => gallery?.move(1));
  dialog.addEventListener("close", release);
  dialog.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      gallery?.move(event.key === "ArrowLeft" ? -1 : 1);
    }
  });
  dialog.addEventListener("click", event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  return {
    open(index = 0, trigger = document.activeElement) {
      if (destroyed || !sources.length || dialog.open) return;
      active = Math.max(0, Math.min(sources.length - 1, index));
      opener = trigger instanceof HTMLElement ? trigger : null;
      const photos = sources.map((source, position) => {
        const photo = document.createElement("img");
        photo.className = "zine-photo";
        photo.alt = source.alt || "Работа Чешуи, фото " + (position + 1);
        photo.decoding = "async";
        photo.dataset.gallerySrc = source.src;
        photo.dataset.gallerySrcset = source.srcSet || "";
        photo.dataset.gallerySizes = "(max-width: 700px) calc(100vw - 24px), min(1068px, calc(100vw - 64px))";
        photo.addEventListener("error", () => {
          if (photo.dataset.active === "true") status.textContent = "Не удалось загрузить фотографию";
        });
        photo.addEventListener("load", () => { if (photo.dataset.active === "true") status.textContent = ""; });
        return photo;
      });
      stage.replaceChildren(...photos);
      counter.textContent = (active + 1) + " / " + sources.length;
      overflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      document.body.append(dialog);
      dialog.showModal();
      status.textContent = "";
      gallery = createGallery(stage, index => {
        active = index;
        counter.textContent = (active + 1) + " / " + sources.length;
        if (photos[index]?.complete && photos[index]?.naturalWidth) status.textContent = "";
      }, active);
      const ticket = ++openVersion;
      const current = photos[active];
      // Feedback is outside the photo's layout, so it cannot move the controls.
      const loading = setTimeout(() => {
        if (ticket === openVersion && !current.complete) status.textContent = "Загрузка…";
      }, 250);
      current.decode().catch(() => {}).finally(() => {
        clearTimeout(loading);
        if (ticket === openVersion) status.textContent = current.naturalWidth ? "" : "Не удалось загрузить фотографию";
      });
      dialog.querySelector(".object-lightbox-close").focus();
    },
    destroy() {
      destroyed = true;
      dialog.removeEventListener("close", release);
      openVersion++;
      gallery?.destroy();
      gallery = null;
      if (dialog.open) {
        dialog.close();
        document.body.style.overflow = overflow;
      }
      dialog.remove();
    },
  };
}
