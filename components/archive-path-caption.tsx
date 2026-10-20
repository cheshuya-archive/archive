"use client";

import { useEffect, useRef } from "react";
import { mountArchivePath } from "@/lib/archive-path";
import { useSitePreferences } from "@/components/site-preferences";

export function ArchivePathCaption() {
  const root = useRef<HTMLParagraphElement>(null);
  const { locale } = useSitePreferences();
  useEffect(() => mountArchivePath(root.current, locale), [locale]);
  return <p className="logo-caption" data-path-typewriter ref={root}><span className="section-heading-visually-hidden" data-path-description>{locale === "ru" ? "Чешуя — архив: выставки, мерч, цианотипия, зины, объекты и рисунки." : "Cheshuya archive: exhibitions, merch, cyanotype, zines, objects and drawings."}</span><button className="logo-path-toggle" type="button" aria-label={locale === "ru" ? "Приостановить печать подписи" : "Pause caption typing"} aria-pressed="false"><span className="logo-path-visual" aria-hidden="true"><span data-path-prefix>{locale === "ru" ? "чешуя\\архив\\" : "cheshuya\\archive\\"}</span><span className="logo-path-slot"><span data-path-word /><span className="logo-path-cursor">|</span></span></span></button></p>;
}
