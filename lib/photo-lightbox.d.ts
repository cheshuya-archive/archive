export type PhotoSource = { src: string; srcSet?: string; alt?: string };
type Gallery = { move(direction: -1 | 1): void; show(index: number): void; destroy(): void };
type CreateGallery = (stage: HTMLElement, onChange?: (index: number) => void, initialIndex?: number) => Gallery;
export function createPhotoLightbox(options: {
  images: readonly PhotoSource[];
  label?: string;
  onClose?: (index: number) => void;
}, createGallery: CreateGallery): {
  open(index?: number, trigger?: Element | null): void;
  destroy(): void;
};
