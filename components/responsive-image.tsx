import type { ImgHTMLAttributes } from "react";

const widths = [600, 1200, 2000] as const;
const supportedSource = /\.(avif|jpe?g|png|tiff?|webp)$/i;
const basePath = process.env.NEXT_PUBLIC_GITHUB_PAGES === "true" ? "/cheshuya" : "";

function outputPath(source: string, width: number) {
  const relative = decodeURIComponent(source.replace(/^\/media\//, ""));
  const dot = relative.lastIndexOf(".");
  const basename = dot === -1 ? relative : relative.slice(0, dot);
  return `${basePath}/images/${basename.split("/").map(encodeURIComponent).join("/")}-${width}.webp`;
}

type ResponsiveImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet" | "sizes" | "loading"> & {
  src: string;
  sizes: string;
  priority?: boolean;
  fill?: boolean;
};

/**
 * Native responsive image for static hosting. It uses the WebP variants made
 * by `npm run images:optimize` and falls back to the existing source image.
 */
export function ResponsiveImage({ src, sizes, priority = false, fill = false, style, ...props }: ResponsiveImageProps) {
  const hasVariants = src.startsWith("/media/") && supportedSource.test(src);
  const srcSet = hasVariants
    ? widths.map((width) => `${outputPath(src, width)} ${width}w`).join(", ")
    : undefined;

  return (
    <img
      {...props}
      src={`${basePath}${src}`}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      style={fill ? { position: "absolute", inset: 0, width: "100%", height: "100%", ...style } : style}
    />
  );
}
