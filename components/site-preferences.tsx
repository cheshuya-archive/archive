"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/content/site-content";

type Theme = "light" | "dark";
type Preferences = { theme: Theme; locale: Locale; toggleTheme(): void; toggleLocale(): void };
const Context = createContext<Preferences | null>(null);
const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch {} };
export function SitePreferencesProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [locale, setLocale] = useState<Locale>("ru");
  const explicitTheme = useRef<string | null>(null);
  const applyTheme = (next: Theme) => {
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
    setTheme(next);
  };
  useEffect(() => {
    const savedTheme = read("cheshuya-theme");
    explicitTheme.current = savedTheme === "light" || savedTheme === "dark" ? savedTheme : null;
    const media = matchMedia("(prefers-color-scheme: dark)");
    applyTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
    setLocale(read("cheshuya-locale") === "en" ? "en" : "ru");
    const systemChange = () => { if (!explicitTheme.current) applyTheme(media.matches ? "dark" : "light"); };
    const storageChange = (event: StorageEvent) => {
      if (event.key === "cheshuya-theme" || event.key === null) {
        const value = read("cheshuya-theme");
        explicitTheme.current = value === "light" || value === "dark" ? value : null;
        applyTheme(explicitTheme.current === "dark" || (!explicitTheme.current && media.matches) ? "dark" : "light");
      }
      if (event.key === "cheshuya-locale" || event.key === null) setLocale(read("cheshuya-locale") === "en" ? "en" : "ru");
    };
    media.addEventListener("change", systemChange);
    window.addEventListener("storage", storageChange);
    return () => { media.removeEventListener("change", systemChange); window.removeEventListener("storage", storageChange); };
  }, []);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.dispatchEvent(new CustomEvent("cheshuya:locale", { detail:locale }));
  }, [locale]);
  const toggleTheme = () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    explicitTheme.current = next;
    write("cheshuya-theme", next);
    applyTheme(next);
  };
  const toggleLocale = () => {
    const next = locale === "ru" ? "en" : "ru";
    write("cheshuya-locale", next);
    setLocale(next);
  };
  return <Context.Provider value={{ theme, locale, toggleTheme, toggleLocale }}>{children}</Context.Provider>;
}
export function useSitePreferences() {
  const value = useContext(Context);
  if (!value) throw new Error("SitePreferencesProvider is required");
  return value;
}
export function ThemeToggle() {
  const { theme, locale, toggleTheme } = useSitePreferences();
  const label = locale === "en" ? (theme === "dark" ? "Use light theme" : "Use dark theme") : (theme === "dark" ? "Включить светлую тему" : "Включить тёмную тему");
  return <Button className="theme-toggle" variant="outline" size="icon" aria-label={label} aria-pressed={theme === "dark"} title={label} onClick={toggleTheme}><Moon className="theme-moon" size={18}/><Sun className="theme-sun" size={18}/></Button>;
}
export function LanguageToggle({ inline = false }: { inline?: boolean }) {
  const { locale, toggleLocale } = useSitePreferences();
  const button = <Button className="language-button" variant="outline" size="icon" aria-label={locale === "ru" ? "Сменить язык" : "Switch language"} onClick={toggleLocale}>{locale === "ru" ? "En" : "Ru"}</Button>;
  return inline ? button : <div className="menu-preferences">{button}</div>;
}
