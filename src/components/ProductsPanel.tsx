"use client";
import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useContent } from "./ContentProvider";
import { useT } from "@/lib/locale";

export default function ProductsPanel() {
  const { products, settings: s } = useContent();
  const t = useT();
  const cats = ["All", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))];
  const [cat, setCat] = useState("All");
  const shown = cat === "All" ? products : products.filter((p) => p.category === cat);
  const label = (c: string) => (c === "All" ? t("cat.All") : t(`pcat.${c}`) === `pcat.${c}` ? c : t(`pcat.${c}`));

  if (products.length === 0) {
    return <p className="rounded-[2.75rem] border border-line p-10 text-center text-cream/70">{t("products.empty")}</p>;
  }

  return (
    <div>
      {cats.length > 2 && (
        <div className="mb-8 flex flex-wrap gap-2" role="group">
          {cats.map((c) => (
            <button key={c} onClick={() => setCat(c)} aria-pressed={cat === c} className={`rounded-full border px-4 py-2 text-sm transition ${cat === c ? "border-accent bg-accent/15 text-accent2" : "border-line text-cream/70 hover:border-cream/40"}`}>{label(c)}</button>
          ))}
        </div>
      )}
      <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {shown.map((p, i) => (
            <motion.li
              layout key={p.id}
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.04, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="group"
            >
              <div className={`relative aspect-square overflow-hidden bg-gradient-to-br from-ink-3 via-accent/20 to-counter/20 ${i % 2 ? "blob-b" : "blob"}`}>
                {p.imageUrl ? (
                  <Image src={p.imageUrl} alt={p.name} fill sizes="(max-width:768px) 45vw, 340px" className="object-cover transition-transform duration-[1200ms] group-hover:scale-105" />
                ) : (
                  <span className="font-display absolute inset-0 grid place-items-center text-5xl font-light text-cream/60 italic">{p.name.slice(0, 1)}</span>
                )}
                {!p.inStock && <span className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-ink/80 px-3 py-1 text-[0.65rem] tracking-widest uppercase backdrop-blur">{t("products.out")}</span>}
              </div>
              <div className="mt-4 px-1 text-center sm:text-left">
                {p.category && <p className="text-[0.65rem] tracking-[0.25em] text-accent uppercase">{label(p.category)}</p>}
                <h3 className="font-display mt-1 text-xl leading-snug sm:text-2xl">{p.name}</h3>
                {p.blurb && <p className="mt-1 text-sm text-cream/65">{p.blurb}</p>}
                <div className="mt-3 flex items-center justify-center gap-4 sm:justify-start">
                  {p.price > 0 && <span className="font-display text-xl text-accent2">${p.price}</span>}
                  {p.link ? (
                    <a href={p.link} target="_blank" rel="noreferrer" className="btn-accent rounded-full px-5 py-2 text-sm">{t("products.buy")}</a>
                  ) : (
                    s.phone || s.email ? <a href={s.phone ? `tel:${s.phone}` : `mailto:${s.email}?subject=${encodeURIComponent(p.name)}`} className="btn-ghost rounded-full px-5 py-2 text-sm">{t("products.ask")}</a> : null
                  )}
                </div>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
