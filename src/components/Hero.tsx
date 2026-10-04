"use client";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import StrandField from "./StrandField";
import ShadeSwitcher from "./ShadeSwitcher";
import { goTab } from "@/lib/tabs";
import { site } from "@/lib/site";
import { useClientValue } from "@/lib/client-value";
import { openNowLabel } from "@/lib/availability";

const words = ["Your", "color,", "composed."];
const marquee = ["Balayage", "Precision Cuts", "Vivid Color", "Platinum", "Bridal", "Gloss", "Curl Sculpting", "Blowouts", "Bond Repair", "Color Correction"];

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const open = useClientValue(() => openNowLabel(new Date()), "");

  return (
    <section ref={ref} className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden pt-28 pb-36 sm:pb-40">
      <motion.div style={{ y }} className="absolute inset-0 -z-10">
        <StrandField />
        <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_20%_55%,transparent,var(--ink)_95%)]" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-ink to-transparent" />
      </motion.div>

      <motion.div style={{ opacity: fade }} className="mx-auto w-full max-w-7xl px-4 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs tracking-[0.22em] text-muted uppercase"
        >
          <span>{site.city}</span>
          <span className="h-px w-8 bg-line" />
          <span>by {site.stylist}</span>
          {open && (
            <>
              <span className="hidden h-px w-8 bg-line sm:block" />
              <span className="flex items-center gap-2 text-counter"><span className="pulse-dot size-1.5 rounded-full bg-counter" />{open}</span>
            </>
          )}
        </motion.div>

        <h1 className="font-display text-[clamp(3.4rem,11vw,10rem)] leading-[0.9] font-light tracking-tight">
          {words.map((wd, i) => (
            <span key={wd} className="mr-[0.22em] inline-block overflow-hidden pb-[0.12em] align-bottom">
              <motion.span
                className={`inline-block ${i === 1 ? "text-shade italic" : ""}`}
                initial={{ y: "110%", rotate: 4 }}
                animate={{ y: 0, rotate: 0 }}
                transition={{ delay: 0.35 + i * 0.12, duration: 1, ease: [0.16, 1, 0.3, 1] }}
              >
                {wd}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 0.8 }}
          className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"
        >
          <div className="max-w-md">
            <p className="text-lg leading-relaxed text-cream/80">
              A private color &amp; cutting atelier. Every head of hair is a one-off composition: tone, light and shape, built around you.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => goTab("book")} className="btn-accent rounded-full px-7 py-3.5">Reserve your chair</button>
              <button onClick={() => goTab("work")} className="btn-ghost rounded-full px-7 py-3.5">See the work</button>
            </div>
          </div>
          <div className="glass flex items-center gap-5 self-start rounded-2xl px-5 py-4 lg:self-auto">
            <div>
              <p className="text-[0.65rem] tracking-[0.25em] text-muted uppercase">Try a shade</p>
              <p className="mt-1 text-sm text-cream/70">Tap one. The whole studio recolors.</p>
            </div>
            <ShadeSwitcher labelled />
          </div>
        </motion.div>
      </motion.div>

      <div className="absolute inset-x-0 bottom-24 overflow-hidden border-y border-line bg-ink/40 py-3 backdrop-blur-sm sm:bottom-28" aria-hidden>
        <div className="marquee flex w-max gap-10 whitespace-nowrap">
          {[...marquee, ...marquee].map((m, i) => (
            <span key={i} className="flex items-center gap-10 font-display text-lg text-cream/60 italic">
              {m}<span className="text-accent">✦</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
