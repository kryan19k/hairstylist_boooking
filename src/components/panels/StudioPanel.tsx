"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { aftercare, faqs } from "@/lib/data";
import { dayNames, site } from "@/lib/site";
import { formatTime, openNowLabel } from "@/lib/availability";
import { useClientValue } from "@/lib/client-value";
import { goTab } from "@/lib/tabs";

const gifts = [50, 100, 150, 250];

function Hours() {
  const today = useClientValue(() => new Date().getDay(), -1);
  const label = useClientValue(() => openNowLabel(new Date()), "");
  return (
    <div className="glass rounded-3xl p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-2xl">Hours</h3>
        {label && <span className="flex items-center gap-2 text-xs text-counter"><span className="pulse-dot size-2 rounded-full bg-counter" />{label}</span>}
      </div>
      <ul className="mt-4 divide-y divide-line text-sm">
        {[2, 3, 4, 5, 6, 0, 1].map((d) => {
          const h = site.hours[d];
          return (
            <li key={d} className={`flex justify-between py-2.5 ${today === d ? "font-semibold text-accent2" : "text-cream/75"}`}>
              <span>{dayNames[d]}</span>
              <span>{h ? `${formatTime(h[0])} – ${formatTime(h[1])}` : "Closed"}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Gift() {
  const [amt, setAmt] = useState(100);
  return (
    <div className="paper relative overflow-hidden rounded-3xl p-6">
      <div className="pointer-events-none absolute -right-10 -bottom-10 size-48 rounded-full bg-[radial-gradient(circle,var(--accent),transparent_70%)] opacity-50" />
      <p className="text-xs tracking-[0.3em] uppercase opacity-60">Gift card</p>
      <h3 className="font-display mt-2 text-3xl">Give someone a glow-up</h3>
      <div className="mt-5 flex flex-wrap gap-2">
        {gifts.map((g) => (
          <button key={g} onClick={() => setAmt(g)} aria-pressed={amt === g} className={`rounded-full border px-4 py-2 text-sm transition ${amt === g ? "border-paper-ink bg-paper-ink text-cream" : "border-paper-ink/30 hover:border-paper-ink"}`}>${g}</button>
        ))}
      </div>
      <a href={`mailto:${site.email}?subject=Gift card request ($${amt})`} className="mt-6 inline-block rounded-full bg-paper-ink px-6 py-3 text-sm font-semibold text-cream transition hover:scale-[1.03]">Request a ${amt} gift card</a>
    </div>
  );
}

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div>
      <h3 className="font-display text-3xl">Good questions</h3>
      <div className="mt-4 divide-y divide-line border-y border-line">
        {faqs.map((f, i) => (
          <div key={f.q}>
            <button onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="flex w-full items-center justify-between gap-4 py-4 text-left">
              <span className="font-medium">{f.q}</span>
              <motion.span animate={{ rotate: open === i ? 45 : 0 }} className="text-2xl text-accent">+</motion.span>
            </button>
            <AnimatePresence initial={false}>
              {open === i && (
                <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pr-8 text-cream/70">
                  <span className="block pb-5">{f.a}</span>
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StudioPanel() {
  return (
    <div className="space-y-16">
      <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div className="relative mx-auto aspect-[4/5] w-full max-w-sm">
          <div className="absolute inset-0 rotate-3 rounded-[2rem] border border-accent/40" />
          <div className="float-slow absolute inset-0 grid place-items-center overflow-hidden rounded-[2rem] bg-gradient-to-br from-ink-3 via-accent/30 to-counter/30">
            <span className="font-display px-6 text-center text-6xl font-light italic text-cream/80">{site.stylist.split(" ")[0]}</span>
            <span className="absolute bottom-4 text-[0.65rem] tracking-[0.3em] text-cream/50 uppercase">Portrait goes here</span>
          </div>
        </div>
        <div>
          <p className="text-xs tracking-[0.3em] text-accent uppercase">Meet your colorist</p>
          <h3 className="font-display mt-3 text-4xl leading-tight font-light sm:text-5xl">Hair is the one accessory you <span className="text-shade italic">never take off.</span></h3>
          <p className="mt-6 max-w-xl leading-relaxed text-cream/75">
            I&rsquo;m {site.stylist}. For {site.yearsExperience} years I&rsquo;ve built a practice on slow, honest consultations and color that grows out beautifully. No rushed chairs, no cookie-cutter formulas: one client at a time, in a quiet studio where you can exhale.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={() => goTab("book")} className="btn-accent rounded-full px-7 py-3.5">Book a consultation</button>
            <a href={`https://instagram.com/${site.instagram}`} target="_blank" rel="noreferrer" className="btn-ghost rounded-full px-7 py-3.5">@{site.instagram}</a>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Hours />
        <div className="glass rounded-3xl p-6">
          <h3 className="font-display text-2xl">Find us</h3>
          <p className="mt-4 text-cream/80">{site.address}<br />{site.city}</p>
          <p className="mt-4 text-sm text-muted">Street parking · 3 min from the L train · step-free entrance</p>
          <div className="mt-5 space-y-1 text-sm">
            <a className="block text-accent2 hover:underline" href={`tel:${site.phone}`}>{site.phone}</a>
            <a className="block text-accent2 hover:underline" href={`mailto:${site.email}`}>{site.email}</a>
          </div>
          <a className="btn-ghost mt-5 inline-block rounded-full px-5 py-2.5 text-sm" target="_blank" rel="noreferrer" href={`https://maps.google.com/?q=${encodeURIComponent(`${site.address} ${site.city}`)}`}>Get directions ↗</a>
        </div>
        <Gift />
      </div>

      <Faq />

      <div>
        <h3 className="font-display text-3xl">Aftercare, in four lines</h3>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {aftercare.map((a, i) => (
            <motion.div key={a.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="rounded-2xl border border-line p-5">
              <span className="font-display text-3xl text-accent">0{i + 1}</span>
              <p className="mt-2 font-medium">{a.title}</p>
              <p className="mt-1 text-sm text-cream/65">{a.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
