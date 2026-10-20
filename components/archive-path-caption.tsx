"use client";

import { useEffect, useRef } from "react";
import { mountArchivePath } from "@/lib/archive-path";
import { useSitePreferences } from "@/components/site-preferences";

const basePath = process.env.NEXT_PUBLIC_GITHUB_PAGES === "true" ? "/cheshuya" : "";
const routes = ["/catalog/exhibitions", "/catalog/merch", "/cyanotype", "/catalog/prints", "/catalog/objects", "/catalog/drawings"].map(path => basePath + path);

export function ArchivePathCaption() {
  const root = useRef<HTMLParagraphElement>(null);
  const { locale } = useSitePreferences();
  useEffect(() => mountArchivePath(root.current, locale, { routes }), [locale]);
  return <p className="logo-caption" data-path-typewriter ref={root}><span className="section-heading-visually-hidden" data-path-description>{locale === "ru" ? "Чешуя — архив: выставки, мерч, цианотипия, зины, объекты и рисунки." : "Cheshuya archive: exhibitions, merch, cyanotype, zines, objects and drawings."}</span><a className="logo-path-link" role="link" data-path-link aria-label={locale === "ru" ? "Чешуя — архив" : "Cheshuya archive"} aria-disabled="true" tabIndex={-1}><span className="logo-path-visual" aria-hidden="true"><span data-path-prefix>{locale === "ru" ? "чешуя\\архив\\" : "cheshuya\\archive\\"}</span><span className="logo-path-slot"><span data-path-word /><span className="logo-path-cursor">|</span></span></span></a></p>;
}
