import { ZineDetailPage } from "@/components/zine-detail-page";
import { getCopy } from "@/content/site-content";

const names = [
  "3Zlo6afGt3c",
  "4fZgpzXQfcE",
  "5wvXjj3rEZI",
  "AZYeIfJK54o",
  "CY5UIwCFX20",
  "D1cWDhqV32c",
  "GCMmpzFu8cM",
  "GIF4GS-d1fo",
  "I-hxJI2rWb0",
  "MDobQIxSt4s",
  "Pcez8msbZL0",
  "Vs2tWq9_yGQ",
  "W9jrzIg1Pdc",
  "WHCFx0D2GWE",
  "al7KcZOECno",
  "alOSBlSTCqs",
  "atlbHiA7_6Y",
  "czdaaxuB2Nk",
  "eFPYBFpvxCo",
  "g8MQWCByBUc",
  "hOiPGtNX30k",
  "hVRYznlZ2co",
  "o94VeE3sv-E",
  "riDAaRdNTv4",
  "tvtP058PSf8",
  "zdYfgFdM__E"
];
const cyanotype = {
  slug: "cyanotype", title: "Цианотипия", year: "",
  images: names.map(name => `/images/new-site-assets/cyanotypes/${name}-1200.webp`),
  text: getCopy("ru").cyanotypeText,
};
export default function CyanotypePage() {
  return <ZineDetailPage zine={cyanotype} kind="Цианотипия" backHref="/" videoId="7TaltIvQq9E" videoTitle="Портал, 2024 | Серия отпечатков на бумаге" />;
}
