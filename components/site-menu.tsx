"use client";

import Link from "next/link";
import { Fragment } from "react";
import { Button } from "@/components/ui/button";
import { SheetClose, SheetContent } from "@/components/ui/sheet";
import { LanguageToggle, useSitePreferences } from "@/components/site-preferences";

const groups = [
  { tab: "outside", title: ["Работа в среде", "Work in context"], items: [
    ["outside", "Уличное рисование", "Street drawing"], ["zines", "Печатные издания", "Printed editions"],
    ["cyanotype", "Цианотипия", "Cyanotype"], ["merch", "Мерч", "Merch"],
  ] },
  { tab: "inside", title: ["Работа с материалом", "Work with material"], items: [
    ["inside", "Поиск форм", "Exploring forms"], ["exhibitions", "Выставки", "Exhibitions"],
    ["objects", "Объекты", "Objects"], ["drawings", "Рисунки", "Drawings"],
  ] },
];
export function SiteMenu({ onNavigate }: { onNavigate?: (tab: string, id: string) => void }) {
  const { locale } = useSitePreferences();
  const language = locale === "ru" ? 1 : 2;
  return <SheetContent><nav className="menu-list">{groups.map(group => <Fragment key={group.tab}>
    <p>{group.title[locale === "ru" ? 0 : 1]}</p>
    {group.items.map(item => <SheetClose asChild key={item[0]}>{onNavigate
      ? <Button variant="ghost" onClick={() => onNavigate(group.tab, item[0])}>{item[language]}</Button>
      : <Link href={`/#${item[0]}`}>{item[language]}</Link>}</SheetClose>)}
  </Fragment>)}</nav><LanguageToggle /></SheetContent>;
}
