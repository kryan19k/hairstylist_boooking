"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useT, useLocale, intlTag } from "@/lib/locale";
import { useContent } from "../ContentProvider";
import { formatTime, openNowLabel } from "@/lib/availability";
import { useClientValue } from "@/lib/client-value";


function Hours() {
  const { settings: site } = useContent();
  const t = useT();
  const tag = intlTag(useLocale());
  const today = useClientValue(() => new Date().getDay(), -1);
  const label = useClientValue(() => openNowLabel(new Date(), site.hours, t, tag), "");
  return (
    <div className="glass rounded-[2.75rem] p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-2xl">{t("info.hours")}</h3>
        {label && <span className="flex items-center gap-2 text-xs text-counter"><span className="pulse-dot size-2 rounded-full bg-counter" />{label}</span>}
      </div>
      <ul className="mt-4 divide-y divide-line text-sm">
        {[2, 3, 4, 5, 6, 0, 1].map((d) => {
          const h = site.hours[d];
          return (
            <li key={d} className={`flex justify-between py-2.5 ${today === d ? "font-semibold text-accent2" : "text-cream/75"}`}>
              <span className="capitalize">{new Date(2024, 0, 7 + d).toLocaleDateString(tag, { weekday: "long" })}</span>
              <span>{h ? `${formatTime(h[0])} – ${formatTime(h[1])}` : t("info.closed")}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Gift() {
  const { settings: site } = useContent();
  const t = useT();
  const gifts = site.giftAmounts.split(/[,\s]+/).map((x) => Number(x)).filter((n) => n > 0);
  const [amt, setAmt] = useState(() => gifts[Math.min(1, gifts.length - 1)] ?? 50);
  if (!site.showGiftCards || gifts.length === 0) return null;
  return (
    <div className="paper relative overflow-hidden rounded-[2.75rem] p-6">
      <div className="pointer-events-none absolute -right-10 -bottom-10 size-48 rounded-full bg-[radial-gradient(circle,var(--accent),transparent_70%)] opacity-50" />
      <p className="text-xs tracking-[0.3em] uppercase opacity-60">{t("info.gift")}</p>
      <h3 className="font-display mt-2 text-3xl">{t("info.giftTitle")}</h3>
      <div className="mt-5 flex flex-wrap gap-2">
        {gifts.map((g) => (
          <button key={g} onClick={() => setAmt(g)} aria-pressed={amt === g} className={`rounded-full border px-4 py-2 text-sm transition ${amt === g ? "border-paper-ink bg-paper-ink text-[var(--paper-from)]" : "border-paper-ink/30 hover:border-paper-ink"}`}>${g}</button>
        ))}
      </div>
      {(site.email || site.phone || site.instagram) && (
        <a
          href={site.email ? `mailto:${site.email}?subject=${encodeURIComponent(t("info.giftBtn", { amount: amt }))}` : site.phone ? `sms:${site.phone}` : `https://instagram.com/${site.instagram}`}
          className="mt-6 inline-block rounded-full bg-paper-ink px-6 py-3 text-sm font-semibold text-[var(--paper-from)] transition hover:scale-[1.03]"
        >
          {t("info.giftBtn", { amount: amt })}
        </a>
      )}
    </div>
  );
}

function Faq() {
  const { faqs } = useContent();
  const t = useT();
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div>
      <h3 className="font-display text-3xl">{t("info.faq")}</h3>
      <div className="mt-4 divide-y divide-line border-y border-line">
        {faqs.map((f, i) => (
          <div key={f.id}>
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
  const { settings: site } = useContent();
  const t = useT();
  // Owner-edited tips, or the built-in four when none are set.
  const tips = site.aftercare.length ? site.aftercare : [1, 2, 3, 4].map((n) => ({ t: t(`care.${n}.t`), b: t(`care.${n}.b`) }));
  return (
    <div className="space-y-16">
      <div className="grid gap-6 lg:grid-cols-3">
        <Hours />
        <div className="glass rounded-[2.75rem] p-6">
          <h3 className="font-display text-2xl">{t("info.find")}</h3>
          <p className="mt-4 text-cream/80">{site.address}</p>
          {site.directionsNote && <p className="mt-4 text-sm text-muted">{site.directionsNote}</p>}
          <div className="mt-5 space-y-1 text-sm">
            {site.phone && <a className="block text-accent2 hover:underline" href={`tel:${site.phone}`}>{site.phone}</a>}
            {site.email && <a className="block text-accent2 hover:underline" href={`mailto:${site.email}`}>{site.email}</a>}
          </div>
          <a className="btn-ghost mt-5 inline-block rounded-full px-5 py-2.5 text-sm" target="_blank" rel="noreferrer" href={`https://maps.google.com/?q=${encodeURIComponent(site.address)}`}>{t("info.directions")}</a>
        </div>
        <Gift />
      </div>

      <Faq />

      <div>
        <h3 className="font-display text-3xl">{t("info.aftercare")}</h3>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tips.map((tip, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="rounded-[2rem] border border-line p-5">
              <span className="font-display text-3xl text-accent">{String(i + 1).padStart(2, "0")}</span>
              <p className="mt-2 font-medium">{tip.t}</p>
              <p className="mt-1 text-sm text-cream/65">{tip.b}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
