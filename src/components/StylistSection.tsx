"use client";
import { motion } from "motion/react";
import { useContent } from "./ContentProvider";
import { Portrait } from "./TeamSection";
import { goTab } from "@/lib/tabs";

export default function StylistSection() {
  const { settings: s } = useContent();
  const stats = [
    [`${s.yearsExperience}+`, "years behind the chair"],
    [s.clientsServed, "clients styled"],
    [s.rating.toFixed(2), "average rating"],
  ];
  return (
    <section aria-labelledby="stylist-title" className="relative mx-auto max-w-7xl px-4 pt-20 pb-16 sm:px-8">
      <div className="grid items-center gap-12 rounded-[2rem] border border-line bg-ink-2/50 p-6 sm:p-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="group relative mx-auto w-full max-w-sm">
          <div className="absolute inset-0 -rotate-3 rounded-[2rem] border border-accent/40" />
          <Portrait name={s.stylist} src={s.portraitUrl} className="float-slow relative aspect-[4/5] rounded-[2rem]" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.1 }}>
          <p className="text-xs tracking-[0.3em] text-accent uppercase">Your stylist</p>
          <h2 id="stylist-title" className="font-display mt-3 text-5xl font-light sm:text-6xl">Meet <span className="text-shade italic">{s.stylist.split(" ")[0]}</span></h2>
          <p className="font-display mt-6 text-2xl leading-snug font-light text-cream/90">{s.aboutTitle}</p>
          <p className="mt-4 max-w-xl leading-relaxed text-cream/70">{s.aboutBody}</p>
          <dl className="mt-8 grid grid-cols-3 gap-4 border-y border-line py-6">
            {stats.map(([n, l]) => (
              <div key={l}>
                <dt className="font-display text-3xl text-shade sm:text-4xl">{n}</dt>
                <dd className="mt-1 text-[0.7rem] tracking-[0.15em] text-muted uppercase">{l}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={() => goTab("book")} className="btn-accent rounded-full px-7 py-3.5">Book a consultation</button>
            {s.instagram && <a href={`https://instagram.com/${s.instagram}`} target="_blank" rel="noreferrer" className="btn-ghost rounded-full px-7 py-3.5">@{s.instagram}</a>}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
