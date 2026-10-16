"use client";

import { useCallback, useEffect, useRef } from "react";
import { createPhotoLightbox, type PhotoSource } from "@/lib/photo-lightbox";
import { createImageGallery } from "@/lib/carousel-controller";

export function usePhotoLightbox(images: readonly PhotoSource[], label: string, onClose?: (index: number) => void) {
  const viewer = useRef<ReturnType<typeof createPhotoLightbox> | null>(null);
  const closeCallback = useRef(onClose);
  closeCallback.current = onClose;
  useEffect(() => {
    const instance = createPhotoLightbox({
      images, label, onClose: index => closeCallback.current?.(index),
    }, createImageGallery);
    viewer.current = instance;
    return () => { instance.destroy(); viewer.current = null; };
  }, [images, label]);
  return useCallback((index: number, opener: HTMLElement) => viewer.current?.open(index, opener), []);
}
