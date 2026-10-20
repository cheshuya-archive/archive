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
  if (section === "drawings") return <CatalogPage title="Рисунки" items={drawings} />;
  if (section === "merch") return <CatalogPage title="Мерч" items={[74,75].map(number => ({ title:"Футболка «Дом»", year:"Шелкография · S, M, L, XL", image:`/images/new-site-assets/merch/image%20${number}-1200.webp` }))} />;
  notFound();
}
