// Expand the photograph itself, without a second carousel or a white modal panel.
const motion = matchMedia("(prefers-reduced-motion: reduce)");

function paintedRect(image) {
  const sheet = image.closest(".cyanotype-sheet, .object-slide-button");
  if (sheet) return sheet.getBoundingClientRect();
  const box = image.getBoundingClientRect();
  const width = image.naturalWidth || box.width;
  const height = image.naturalHeight || box.height;
  if (getComputedStyle(image).objectFit !== "contain" || !width || !height) return box;
  const scale = Math.min(box.width / width, box.height / height);
  return {
    left: box.left + (box.width - width * scale) / 2,
    top: box.top + (box.height - height * scale) / 2,
    width: width * scale,
    height: height * scale,
  };
}

function destination(image) {
  const width = image.naturalWidth || 1;
  const height = image.naturalHeight || 1;
  const inset = innerWidth < 701 ? 12 : 24;
  const scale = Math.min((innerWidth - inset * 2) / width, (innerHeight - inset * 2) / height);
  return {
    left: (innerWidth - width * scale) / 2,
    top: (innerHeight - height * scale) / 2,
    width: width * scale,
    height: height * scale,
  };
}

function place(image, rect) {
  for (const key of ["left", "top", "width", "height"]) image.style[key] = `${rect[key]}px`;
}

export function createPhotoExpand(options) {
  let opened = false;
  return {
    open(index = 0, trigger = document.activeElement) {
      if (opened || !options.images[index]) return;
      const initialOrigin = trigger instanceof HTMLImageElement ? trigger : trigger?.querySelector?.("img");
      if (!initialOrigin) return;
      opened = true;
      let activeIndex = index;
      let changeId = 0;
      let closing = false;
      let suppressClickUntil = 0;
      let touchStart = null;
      let navigation = null;
      const dialog = document.createElement("dialog");
      dialog.className = "direct-photo-viewer";
      dialog.setAttribute("aria-label", options.label || "Увеличенная фотография");
      const shade = document.createElement("div");
      shade.className = "direct-photo-shade";
      let enlarged = document.createElement("img");
      enlarged.className = "direct-photo-image";
      enlarged.decoding = "async";
      const closeButton = document.createElement("button");
      closeButton.type = "button";
      closeButton.className = "direct-photo-close";
      closeButton.setAttribute("aria-label", document.documentElement.lang === "en" ? "Close image" : "Закрыть изображение");
      closeButton.textContent = "×";
      const previous = document.createElement("button");
      const next = document.createElement("button");
      for (const [button, direction, label, symbol] of [
        [previous, -1, "Предыдущее фото", "←"],
        [next, 1, "Следующее фото", "→"],
      ]) {
        button.type = "button";
        button.className = `direct-photo-nav ${direction < 0 ? "direct-photo-prev" : "direct-photo-next"}`;
        button.setAttribute("aria-label", label);
        button.textContent = symbol;
      }
      dialog.append(shade, enlarged, previous, next, closeButton);
      const hasMultiple = options.images.length > 1;
      if (!hasMultiple) { previous.hidden = true; next.hidden = true; }
      const overflow = document.body.style.overflow;
      const source = options.images[index];
      enlarged.alt = source.alt || initialOrigin.alt || "";
      enlarged.src = initialOrigin.currentSrc || source.src;
      if (source.src.includes("/cyanotypes/")) enlarged.classList.add("direct-photo-cyanotype");
      place(enlarged, paintedRect(initialOrigin));
      document.body.append(dialog);
      document.body.style.overflow = "hidden";
      dialog.showModal();
      enlarged.getBoundingClientRect(); // Commit the starting geometry before the transition.
      document.dispatchEvent(new CustomEvent("cheshuya:lightbox-open", {
        detail: { stage: options.originStage, id: options.galleryId, index, total: options.images.length },
      }));
      const currentOrigin = () => options.origins?.[activeIndex] || initialOrigin;
      const finish = () => {
        if (!opened) return;
        opened = false;
        dialog.close();
        dialog.remove();
        document.body.style.overflow = overflow;
        options.onClose?.(activeIndex);
        if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus({ preventScroll: true });
      };
      const close = () => {
        if (closing) return;
        closing = true;
        changeId++;
        navigation?.finish();
        options.onBeforeClose?.(activeIndex);
        dialog.classList.remove("is-open");
        requestAnimationFrame(() => requestAnimationFrame(() => {
          const origin = currentOrigin();
          const rect = origin?.isConnected ? paintedRect(origin) : null;
          const visible = rect && rect.width > 0 && rect.height > 0 &&
            rect.left >= -2 && rect.top >= -2 &&
            rect.left + rect.width <= innerWidth + 2 && rect.top + rect.height <= innerHeight + 2;
          if (visible) {
            const clipped = origin.closest(".cyanotype-sheet, .object-slide-button");
            if (clipped) {
              const transform = new DOMMatrixReadOnly(getComputedStyle(origin).transform);
              const scale = Math.hypot(transform.a, transform.b) || 1;
              const crop = Math.max(0, (1 - 1 / scale) * 50);
              enlarged.style.setProperty("--return-scale", scale);
              enlarged.style.setProperty("--return-crop", `${crop}%`);
              enlarged.classList.add("direct-photo-return-clipped");
            }
            place(enlarged, rect);
          }
          else enlarged.style.opacity = "0";
          if (motion.matches) finish();
          else window.setTimeout(finish, 360);
        }));
      };
      const navigate = direction => {
        if (closing || navigation || !hasMultiple) return;
        const nextIndex = (activeIndex + direction + options.images.length) % options.images.length;
        const target = options.images[nextIndex];
        const request = ++changeId;
        const candidate = new Image();
        candidate.sizes = `${Math.round(innerWidth - (innerWidth < 701 ? 24 : 48))}px`;
        if (target.srcSet) candidate.srcset = target.srcSet;
        candidate.src = target.src;
        Promise.resolve(candidate.decode?.()).catch(() => {}).then(() => {
          if (request !== changeId || closing || !candidate.naturalWidth) return;
          candidate.className = "direct-photo-image";
          candidate.classList.toggle("direct-photo-cyanotype", target.src.includes("/cyanotypes/"));
          candidate.alt = target.alt || "";
          const outgoing = enlarged;
          const distance = innerWidth;
          dialog.classList.add("is-navigating");
          place(candidate, destination(candidate));
          candidate.style.transform = `translateX(${direction * distance}px)`;
          dialog.insertBefore(candidate, previous);
          let position = 0;
          let velocity = 0;
          let lastTime = 0;
          let frame = null;
          const finishMove = () => {
            if (frame !== null) cancelAnimationFrame(frame);
            outgoing.remove();
            candidate.style.transform = "";
            enlarged = candidate;
            activeIndex = nextIndex;
            navigation = null;
            dialog.classList.remove("is-navigating");
            if (!closing) document.dispatchEvent(new CustomEvent("cheshuya:lightbox-change", {
              detail: { stage: options.originStage, id: options.galleryId, index: activeIndex, total: options.images.length },
            }));
          };
          navigation = { finish: finishMove };
          const animate = now => {
            const dt = lastTime ? Math.min((now - lastTime) / 1000, .064) : 1 / 60;
            lastTime = now;
            // Match the critically damped motion used by the inline carousels.
            const omega = 28;
            const offset = position - 1;
            const term = (velocity + omega * offset) * dt;
            const decay = Math.exp(-omega * dt);
            velocity = (velocity - omega * term) * decay;
            position = 1 + (offset + term) * decay;
            outgoing.style.transform = `translateX(${-direction * distance * position}px)`;
            candidate.style.transform = `translateX(${direction * distance * (1 - position)}px)`;
            if (Math.abs(position - 1) < .001 && Math.abs(velocity) < .01) finishMove();
            else frame = requestAnimationFrame(animate);
          };
          if (motion.matches) finishMove();
          else frame = requestAnimationFrame(animate);
        });
      };
      previous.addEventListener("click", () => navigate(-1));
      next.addEventListener("click", () => navigate(1));
      closeButton.addEventListener("click", close);
      dialog.addEventListener("click", event => {
        if ((event.target === dialog || event.target.classList?.contains("direct-photo-image")) && Date.now() > suppressClickUntil) close();
      });
      dialog.addEventListener("cancel", event => { event.preventDefault(); close(); });
      dialog.addEventListener("keydown", event => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          navigate(event.key === "ArrowLeft" ? -1 : 1);
        }
      });
      dialog.addEventListener("touchstart", event => {
        if (event.touches.length === 1) touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
      }, { passive: true });
      dialog.addEventListener("touchend", event => {
        if (!touchStart || !event.changedTouches.length) return;
        const dx = event.changedTouches[0].clientX - touchStart.x;
        const dy = event.changedTouches[0].clientY - touchStart.y;
        touchStart = null;
        if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
        suppressClickUntil = Date.now() + 500;
        navigate(dx < 0 ? 1 : -1);
      }, { passive: true });
      requestAnimationFrame(() => {
        if (closing) return;
        dialog.classList.add("is-open");
        place(enlarged, destination(initialOrigin));
        if (source.srcSet) {
          enlarged.sizes = `${Math.round(destination(initialOrigin).width)}px`;
          enlarged.srcset = source.srcSet;
        }
        closeButton.focus({ preventScroll: true });
      });
    },
  };
}
