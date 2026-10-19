"use client";
import { translateText } from "@/lib/site-translations";
import Link from "next/link";
import { useSitePreferences } from "@/components/site-preferences";
export function SectionBreadcrumbs({ items }: { items: { label:string; href?:string }[] }) {
  const { locale } = useSitePreferences();
  const trail = [{ label:locale === "ru" ? "Главная" : "Home", href:"/" }, ...items];
  return <nav className="section-breadcrumbs" aria-label={locale === "ru" ? "Путь по разделам" : "Breadcrumb"}><ol>{trail.map((item,index) => <li key={index} aria-current={!item.href && index === trail.length-1 ? "page" : undefined}>{item.href ? <Link href={item.href}>{translateText(item.label, locale)}</Link> : <span>{translateText(item.label, locale)}</span>}</li>)}</ol></nav>;
}
