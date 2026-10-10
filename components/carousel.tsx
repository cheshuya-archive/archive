"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";

type Item = { title?: string; note?: string; year?: string; image: string };

export function Carousel({ items, type = "standard" }: { items: Item[]; type?: "standard" | "art" }) {
  const rail = useRef<HTMLDivElement>(null);
  const move = (amount: number) => rail.current?.scrollBy({ left: amount, behavior: "smooth" });
  return <div className={`carousel ${type}`}>
    <div className="carousel-actions"><Button aria-label="Назад" onClick={() => move(-360)} variant="outline" size="icon"><ChevronLeft size={18}/></Button><Button aria-label="Вперёд" onClick={() => move(360)} variant="outline" size="icon"><ChevronRight size={18}/></Button></div>
    <div className="carousel-rail" ref={rail}>
      {items.map((item, index) => <article className="carousel-card" key={`${item.image}-${index}`}>
        <div className="image-wrap"><Image src={item.image} alt={item.title || "Работа Чешуи"} fill sizes="(max-width: 700px) 82vw, 31vw" /></div>
        {(item.title || item.year) && <div className="card-caption"><span>{item.title}</span><span>{item.note || item.year}</span></div>}
      </article>)}
    </div>
  </div>;
}
