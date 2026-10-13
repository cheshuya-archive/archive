import { notFound } from "next/navigation";
import { ZineDetailPage } from "@/components/zine-detail-page";
import { zineDetails } from "@/content/site-content";

export function generateStaticParams() {
  return Object.keys(zineDetails).map((slug) => ({ slug }));
}

export default async function ZinePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const zine = zineDetails[slug as keyof typeof zineDetails];
  if (!zine) notFound();
  return <ZineDetailPage zine={zine} />;
}
