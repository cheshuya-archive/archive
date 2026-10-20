"use client";
import Link from "next/link";
import { Fragment } from "react";
import { SheetClose, SheetContent } from "@/components/ui/sheet";
import { LanguageToggle, ThemeToggle, useSitePreferences } from "@/components/site-preferences";
const groups = [
  { title:["Работа в среде","Work in context"], items:[
    ["/catalog/prints","Печатные издания","Printed editions"],
    ["/cyanotype","Цианотипия","Cyanotype"],
    ["/catalog/merch","Мерч","Merch"],
  ] },
  { title:["Работа с материалом","Work with material"], items:[
    ["/catalog/exhibitions","Выставки","Exhibitions"],
    ["/catalog/objects","Объекты","Objects"],
    ["/catalog/drawings","Рисунки","Drawings"],
  ] },
];
export function SiteMenu() {
  const { locale } = useSitePreferences();
  return <SheetContent><nav className="menu-list">{groups.map((group,index) => <Fragment key={index}><p>{group.title[locale === "ru" ? 0 : 1]}</p>{group.items.map(item => <SheetClose asChild key={item[0]}><Link href={item[0]}>{item[locale === "ru" ? 1 : 2]}</Link></SheetClose>)}</Fragment>)}</nav><div className="menu-preferences"><LanguageToggle inline /><ThemeToggle /></div></SheetContent>;
}
