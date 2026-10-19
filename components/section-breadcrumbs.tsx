"use client";
import Link from "next/link";
import { useSitePreferences } from "@/components/site-preferences";
const english: Record<string,string> = { "Печатные издания":"Printed editions", "Выставки":"Exhibitions", "Объекты":"Objects", "Рисунки":"Drawings", "Мерч":"Merch", "Цианотипия":"Cyanotype" };
export function SectionBreadcrumbs({ items }: { items: { label:string; href?:string }[] }) {
  const { locale } = useSitePreferences();
  const trail = [{ label:locale === "ru" ? "Главная" : "Home", href:"/" }, ...items];
  return <nav className="section-breadcrumbs" aria-label={locale === "ru" ? "Путь по разделам" : "Breadcrumb"}><ol>{trail.map((item,index) => <li key={index} aria-current={!item.href && index === trail.length-1 ? "page" : undefined}>{item.href ? <Link href={item.href}>{locale === "en" ? english[item.label] || item.label : item.label}</Link> : <span>{locale === "en" ? english[item.label] || item.label : item.label}</span>}</li>)}</ol></nav>;
}
