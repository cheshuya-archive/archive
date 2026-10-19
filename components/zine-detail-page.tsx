"use client";

import { translateText } from "@/lib/site-translations";

import { ResponsiveImage, getResponsiveImageSource } from "@/components/responsive-image";
import Link from "next/link";
import { SectionBreadcrumbs } from "@/components/section-breadcrumbs";
import { ArrowLeft, ChevronLeft, ChevronRight, Menu, Maximize2 } from "lucide-react";
import { useSitePreferences } from "@/components/site-preferences";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePhotoLightbox } from "@/components/use-photo-lightbox";
import { createImageGallery } from "@/lib/carousel-controller";
import { Button } from "@/components/ui/button";
import { SiteMenu } from "@/components/site-menu";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";

type Zine = { slug: string; title: string; year: string; images: readonly string[]; text: string; previous?: string; next?: string };

export function ZineDetailPage({ zine: originalZine, kind: originalKind = "Зин", backHref = "/catalog/prints", videoId, videoTitle = "Видео" }: { zine: Zine; kind?: string; backHref?: string; videoId?: string; videoTitle?: string }) {
  const { locale } = useSitePreferences();
  const tr = (text: string) => translateText(text, locale);
  const zine = useMemo(() => ({ ...originalZine, title: translateText(originalZine.title, locale), text: translateText(originalZine.text, locale) }), [originalZine, locale]);
  const kind = tr(originalKind);
  const [slide, setSlide] = useState(0);
  const hasManyImages = zine.images.length > 1;
  const stage = useRef<HTMLDivElement>(null);
  const gallery = useRef<ReturnType<typeof createImageGallery> | null>(null);
  useEffect(() => {
    if (!stage.current) return;
    const instance = createImageGallery(stage.current, setSlide);
    gallery.current = instance;
    return () => { instance.destroy(); gallery.current = null; };
  }, [zine.slug]);
  const photos = useMemo(() => zine.images.map((src, index) => ({
    ...getResponsiveImageSource(src), alt: `${zine.title}, ${locale === "en" ? "image" : "изображение"} ${index + 1}`,
  })), [zine]);
  const zoom = useRef<HTMLButtonElement>(null);
  const openPhoto = usePhotoLightbox(photos, `${locale === "en" ? "Photos" : "Фотографии"}: ${zine.title}`, index => gallery.current?.show(index));
  const enlarge = () => { if (zoom.current) openPhoto(slide, zoom.current); };
  const move = (direction: -1 | 1) => gallery.current?.move(direction);
  return <main className="zine-page"><header className="zine-header"><div className="zine-return"><Button asChild variant="outline" size="icon" aria-label={tr("Назад")}><Link href={backHref}><ArrowLeft size={17}/></Link></Button></div><div className="zine-global-controls inner-header-controls"><Sheet><SheetTrigger asChild><Button variant="outline" size="icon" aria-label={tr("Открыть меню")}><Menu size={18}/></Button></SheetTrigger><SiteMenu /></Sheet></div></header><section className="zine-layout"><div className="zine-carousel" tabIndex={0} role="region" aria-label={`${locale === "en" ? "Photos" : "Фотографии"}: ${zine.title}`}><div className="zine-slide can-enlarge" ref={stage} key={zine.slug} onClick={event => { if (event.target instanceof HTMLImageElement) enlarge(); }}>{zine.images.map((image, index) => <ResponsiveImage key={image} className="zine-photo" data-active={index === 0} aria-hidden={index !== 0} src={image} alt={`${zine.title}, ${locale === "en" ? "image" : "изображение"} ${index + 1}`} sizes="(max-width: 700px) 100vw, 52vw" priority={index === 0} deferred={index > 0} />)}</div>{hasManyImages && <div className="zine-controls"><Button variant="outline" size="icon" aria-label={tr("Предыдущее изображение")} onClick={() => move(-1)}><ChevronLeft size={17}/></Button><Button variant="outline" size="icon" aria-label={tr("Следующее изображение")} onClick={() => move(1)}><ChevronRight size={17}/></Button></div>}<span className="counter gallery-counter" role="status" aria-live="polite">{slide + 1} / {zine.images.length}</span><button className="gallery-zoom" type="button" aria-label={tr("Открыть изображение крупно")} ref={zoom} onClick={enlarge}><Maximize2 size={17}/></button></div><div className="zine-info"><SectionBreadcrumbs items={kind === zine.title ? [{label:zine.title}] : [{label:"Печатные издания",href:"/catalog/prints"}]} />{(kind !== zine.title || zine.year) && <p className="zine-meta">{kind}{zine.year ? ` · ${zine.year}` : ""}</p>}<h1 className={kind === zine.title ? "section-heading-visually-hidden" : undefined}>{zine.title}</h1>{zine.text ? <p>{zine.text}</p> : <p className="zine-placeholder">Описание и дополнительные развороты этого издания пока не добавлены в экспорт материалов.</p>}{zine.previous && zine.next && <nav className="zine-pagination" aria-label={tr("Переход между зинами")}><Button asChild variant="outline" size="icon" aria-label={tr("Предыдущий зин")}><Link href={`/zines/${zine.previous}`}><ChevronLeft size={17}/></Link></Button><Button asChild variant="outline" size="icon" aria-label={tr("Следующий зин")}><Link href={`/zines/${zine.next}`}><ChevronRight size={17}/></Link></Button></nav>}</div></section>{videoId && <section className="cyanotype-video" aria-labelledby="cyanotype-video-title"><h2 id="cyanotype-video-title">{tr("Видео")}</h2><div className="cyanotype-video-frame"><iframe src={`https://www.youtube-nocookie.com/embed/${videoId}`} title={tr(videoTitle)} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div></section>}</main>;
}
