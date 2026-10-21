import { notFound } from "next/navigation";
import { CatalogPage } from "@/components/catalog-page";
import { drawings, exhibitions, objects, zines } from "@/content/site-content";

export function generateStaticParams() {
  return ["prints", "exhibitions", "objects", "drawings", "merch"].map((section) => ({ section }));
}

export default async function Page({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (section === "prints") return <CatalogPage title="Печатные издания" items={zines} />;
  if (section === "exhibitions") return <CatalogPage title="Выставки" items={exhibitions} />;
  if (section === "objects") return <CatalogPage title="Объекты" items={objects} />;
  if (section === "drawings") return <CatalogPage title="Графика" items={drawings} />;
  if (section === "merch") return <CatalogPage title="Мерч" items={[
    { title: "Футболка «Дом» — белая", year: "", image: "/images/merch/dom/white/01-1200.webp" },
    { title: "Футболка «Дом» — чёрная", year: "", image: "/images/merch/dom/black/01-1200.webp" },
  ]} />;
  notFound();
}
