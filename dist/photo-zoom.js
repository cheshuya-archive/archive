/**
 * Pinch/pan inside the dialog only. The untransformed rail keeps its geometry;
 * a clipped overlay displays the enlarged image without changing scroll stops.
 */
export function createPhotoZoom(stage, { cancel, show, getIndex, onScale }) {
  const pointers = new Map();
  const layer = document.createElement("div");
  layer.className = "photo-zoom-layer";
  layer.hidden = true;
  layer.setAttribute("aria-hidden", "true");
  const image = document.createElement("img");
  image.className = "photo-zoom-image";
  image.alt = "";
  image.draggable = false;
  image.decoding = "async";
  layer.append(image);
  stage.after(layer);
  let scale = 1, x = 0, y = 0, gesture = null, hadPinch = false;
  let lastTap = null, imageIndex = -1, resolution = 0;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const photo = () => stage.querySelectorAll("img")[getIndex()];
  const point = event => {
    const rect = stage.getBoundingClientRect();
    return { x: event.clientX - rect.left - rect.width / 2, y: event.clientY - rect.top - rect.height / 2 };
  };
  const pair = () => {
    const [a, b] = [...pointers.values()];
    return { distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  };
  const draw = () => {
    const source = photo();
    if (!source?.naturalWidth) return;
    const width = stage.clientWidth, height = stage.clientHeight;
    const fit = Math.min(width / source.naturalWidth, height / source.naturalHeight);
    const limitX = Math.max(0, (source.naturalWidth * fit * scale - width) / 2);
    const limitY = Math.max(0, (source.naturalHeight * fit * scale - height) / 2);
    x = clamp(x, -limitX, limitX);
    y = clamp(y, -limitY, limitY);
    if (scale > 1.01) {
      const nextResolution = [600, 800, 1200, 2000].find(value => value >= width * scale) || 2000;
      if (imageIndex !== getIndex() || nextResolution > resolution) {
        image.sizes = nextResolution + "px";
        image.srcset = source.srcset || "";
        image.src = source.src;
        imageIndex = getIndex();
        resolution = nextResolution;
      }
      layer.hidden = false;
      image.style.transform = "translate(" + x + "px," + y + "px) scale(" + scale + ")";
    } else {
      scale = 1; x = y = 0;
      layer.hidden = true;
      image.style.removeProperty("transform");
    }
    stage.dataset.zoomed = String(scale > 1);
    stage.dataset.zoomScale = scale.toFixed(3);
    onScale(scale);
  };
  const endPointers = () => {
    const ids = [...pointers.keys()];
    pointers.clear();
    gesture = null;
    ids.forEach(id => { if (stage.hasPointerCapture(id)) stage.releasePointerCapture(id); });
    stage.removeAttribute("data-dragging");
  };
  const reset = () => {
    // Counter updates during a normal swipe must not interrupt that swipe.
    if (scale > 1) endPointers();
    scale = 1; x = y = 0; lastTap = null;
    layer.hidden = true;
    image.removeAttribute("src");
    image.removeAttribute("srcset");
    image.style.removeProperty("transform");
    imageIndex = -1; resolution = 0;
    stage.dataset.zoomed = "false";
    stage.dataset.zoomScale = "1.000";
    onScale(1);
  };
  const toggle = origin => {
    if (!photo()?.naturalWidth) return;
    cancel();
    stage.scrollLeft = getIndex() * stage.clientWidth;
    const next = scale > 1 ? 1 : 2.5;
    const anchor = origin || { x: 0, y: 0 };
    x = anchor.x - (anchor.x - x) * next / scale;
    y = anchor.y - (anchor.y - y) * next / scale;
    scale = next;
    draw();
  };
  const startGesture = () => {
    const first = [...pointers.values()][0];
    if (pointers.size >= 2) {
      stage.scrollLeft = getIndex() * stage.clientWidth;
      const middle = pair();
      gesture = { type: "pinch", ...middle, scale, originX: (middle.x - x) / scale, originY: (middle.y - y) / scale };
      hadPinch = true;
      lastTap = null;
    } else if (first) gesture = {
      type: scale > 1 || hadPinch ? "pan" : "swipe",
      startX: first.x, startY: first.y, x, y, scroll: stage.scrollLeft,
      index: getIndex(), started: performance.now(), moved: false,
    };
  };
  const down = event => {
    if (event.pointerType === "mouse" && (event.button !== 0 || scale === 1)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!pointers.size) { cancel(); hadPinch = false; }
    pointers.set(event.pointerId, point(event));
    stage.setPointerCapture(event.pointerId);
    stage.setAttribute("data-dragging", "");
    startGesture();
  };
  const move = event => {
    if (!pointers.has(event.pointerId)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const current = point(event);
    pointers.set(event.pointerId, current);
    if (!gesture) return;
    if (pointers.size >= 2) {
      const middle = pair();
      scale = clamp(gesture.scale * middle.distance / gesture.distance, 1, 4);
      x = middle.x - gesture.originX * scale;
      y = middle.y - gesture.originY * scale;
      draw();
    } else {
      const dx = current.x - gesture.startX, dy = current.y - gesture.startY;
      gesture.moved ||= Math.hypot(dx, dy) > 8;
      if (gesture.type === "pan") { x = gesture.x + dx; y = gesture.y + dy; draw(); }
      else if (Math.abs(dx) > Math.abs(dy) || Math.abs(stage.scrollLeft - gesture.scroll) > 1) {
        stage.scrollLeft = gesture.scroll - dx;
      }
    }
  };
  const up = event => {
    if (!pointers.has(event.pointerId)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const current = point(event), previous = gesture;
    pointers.delete(event.pointerId);
    if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
    if (pointers.size) { startGesture(); return; }
    gesture = null;
    const cancelled = event.type !== "pointerup";
    if (previous?.type === "swipe" && !hadPinch) {
      const dx = current.x - previous.startX, dy = current.y - previous.startY;
      const elapsed = Math.max(1, performance.now() - previous.started);
      const swiped = !cancelled && Math.abs(dx) > Math.abs(dy) &&
        (Math.abs(dx) > Math.max(40, stage.clientWidth * .15) || (Math.abs(dx) > 25 && Math.abs(dx) / elapsed > .45));
      // show() suspends snap while the requested image decodes.
      show(previous.index + (swiped ? (dx < 0 ? 1 : -1) : 0));
    }
    stage.removeAttribute("data-dragging");
    if (!cancelled && !hadPinch && !previous?.moved && event.pointerType !== "mouse") {
      const now = performance.now();
      if (lastTap && now - lastTap.time < 300 && Math.hypot(current.x - lastTap.x, current.y - lastTap.y) < 28) {
        toggle(current);
        lastTap = null;
      } else lastTap = { ...current, time: now };
    }
    if (scale < 1.05) { scale = 1; draw(); }
  };
  const doubleClick = event => {
    event.preventDefault();
    toggle(point(event));
  };
  const resize = new ResizeObserver(() => {
    if (pointers.size) { endPointers(); show(getIndex()); }
    draw();
  });
  resize.observe(stage);
  stage.dataset.zoomScale = "1.000";
  stage.addEventListener("pointerdown", down, true);
  stage.addEventListener("pointermove", move, true);
  stage.addEventListener("pointerup", up, true);
  stage.addEventListener("pointercancel", up, true);
  stage.addEventListener("lostpointercapture", up, true);
  stage.addEventListener("dblclick", doubleClick);
  return {
    reset, toggle,
    destroy() {
      endPointers();
      resize.disconnect();
      stage.removeEventListener("pointerdown", down, true);
      stage.removeEventListener("pointermove", move, true);
      stage.removeEventListener("pointerup", up, true);
      stage.removeEventListener("pointercancel", up, true);
      stage.removeEventListener("lostpointercapture", up, true);
      stage.removeEventListener("dblclick", doubleClick);
      stage.removeAttribute("data-zoomed");
      stage.removeAttribute("data-zoom-scale");
      layer.remove();
    },
  };
}
