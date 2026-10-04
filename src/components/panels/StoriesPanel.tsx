"use client";
import { motion } from "motion/react";
import { useContent } from "../ContentProvider";
import { goTab } from "@/lib/tabs";
import { useT } from "@/lib/locale";

const Stars = ({ n }: { n: number }) => (
  <span aria-label={`${n} out of 5 stars`} className="tracking-widest text-accent">{"★".repeat(n)}</span>
);

export default function StoriesPanel() {
  const { reviews, settings: site } = useContent();
  const t = useT();
  return (
    <div>
      <div className="mb-12 grid gap-6 rounded-[2.75rem] border border-line p-6 sm:grid-cols-3 sm:p-8">
        {[
          [site.rating.toFixed(2), t("stories.rating")],
          [site.clientsServed, t("stories.clients")],
          [`${site.yearsExperience} ${t("stories.yrs")}`, t("stories.years")],
        ].map(([n, l], i) => (
          <motion.div key={l} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="text-center sm:text-left">
            <p className="font-display text-5xl text-shade sm:text-6xl">{n}</p>
            <p className="mt-1 text-xs tracking-[0.25em] text-muted uppercase">{l}</p>
          </motion.div>
        ))}
      </div>

      <div className="columns-1 gap-5 md:columns-2 lg:columns-3">
        {reviews.map((r, i) => (
          <motion.figure
            key={r.id}
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.08, duration: 0.6 }}
            whileHover={{ y: -4 }}
            className="glass relative mb-5 break-inside-avoid rounded-[2.75rem] p-6"
          >
            <span aria-hidden className="font-display absolute top-2 right-5 text-7xl text-accent/20">&rdquo;</span>
            <Stars n={r.stars} />
            <blockquote className="font-display mt-4 text-xl leading-snug font-light">{r.quote}</blockquote>
            <figcaption className="mt-5 flex items-center gap-3 text-sm">
              <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-accent2 to-accent text-sm font-bold text-on-accent">{r.name[0]}</span>
              <span><span className="block font-medium">{r.name}</span><span className="text-xs text-muted">{r.service}</span></span>
            </figcaption>
          </motion.figure>
        ))}
      </div>

      <div className="mt-8 text-center">
        <button onClick={() => goTab("book")} className="btn-accent rounded-full px-8 py-3.5">{t("stories.cta")}</button>
      </div>
    </div>
  );
}
