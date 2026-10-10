import { notFound } from "next/navigation";
import { CatalogPage } from "@/components/catalog-page";
import { drawings, exhibitions, objects, zines } from "@/content/site-content";

export default async function Page({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (section === "prints") return <CatalogPage title="Печатные издания" items={zines} />;
  if (section === "exhibitions") return <CatalogPage title="Выставки" items={exhibitions} />;
  if (section === "objects") return <CatalogPage title="Объекты" items={objects} />;
  if (section === "drawings") return <CatalogPage title="Рисунки" items={drawings} />;
  notFound();
}
