"use client";
import { motion } from "motion/react";
import { useContent } from "./ContentProvider";
import { Portrait } from "./TeamSection";
import { goTab } from "@/lib/tabs";
import { useT } from "@/lib/locale";

export default function StylistSection() {
  const { settings: s } = useContent();
  const t = useT();
  const stats = [
    [`${s.yearsExperience}+`, t("stylist.years")],
    [s.clientsServed, t("stylist.clients")],
    [s.rating.toFixed(2), t("stylist.rating")],
  ];
  return (
    <section aria-labelledby="stylist-title" className="relative mx-auto max-w-7xl px-4 pt-14 pb-12 sm:px-8 sm:pt-20 sm:pb-16">
      <div className="grid items-center gap-10 rounded-[2rem] border border-line bg-ink-2/50 p-5 sm:gap-12 sm:p-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="group relative mx-auto w-full max-w-[15rem] sm:max-w-sm">
          <div className="blob-b absolute inset-0 -rotate-6 border border-accent/40" />
          <div aria-hidden className="blob absolute -right-6 -bottom-6 size-24 bg-accent/25 blur-xl" />
          <Portrait name={s.stylist} src={s.portraitUrl} className="blob-morph float-slow relative aspect-square" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.1 }}>
          <p className="text-xs tracking-[0.3em] text-accent uppercase">{s.aboutKicker || t("stylist.kicker")}</p>
          <h2 id="stylist-title" className="font-display mt-3 text-4xl font-light sm:text-6xl">{s.aboutMeet || t("stylist.meet")} <span className="text-shade italic">{s.stylist.split(" ")[0]}</span></h2>
          <p className="font-display mt-6 text-2xl leading-snug font-light text-cream/90">{s.aboutTitle}</p>
          <p className="mt-4 max-w-xl leading-relaxed text-cream/70">{s.aboutBody}</p>
          <dl className="mt-6 grid grid-cols-3 gap-3 border-y border-line py-5 sm:mt-8 sm:gap-4 sm:py-6">
            {stats.map(([n, l]) => (
              <div key={l}>
                <dt className="font-display text-2xl text-shade sm:text-4xl">{n}</dt>
                <dd className="mt-1 text-[0.62rem] leading-tight tracking-[0.12em] text-muted uppercase sm:text-[0.7rem]">{l}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={() => goTab("book")} className="btn-accent rounded-full px-7 py-3.5">{s.aboutCta || t("stylist.cta")}</button>
            {s.instagram && <a href={`https://instagram.com/${s.instagram}`} target="_blank" rel="noreferrer" className="btn-ghost rounded-full px-7 py-3.5">@{s.instagram}</a>}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
