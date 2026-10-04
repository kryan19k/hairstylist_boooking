"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { categories, type ServiceCategory } from "@/lib/data";
import { useContent } from "../ContentProvider";
import { formatDuration } from "@/lib/availability";
import { useBooking } from "@/lib/booking-store";
import { goTab } from "@/lib/tabs";

/* ---- "Find my service" quiz ---- */
const questions = [
  { q: "What brings you in?", opts: [["cut", "A fresh cut or shape"], ["color", "New color, same lightness"], ["lighter", "Go lighter / blonde"], ["event", "An event or wedding"]] },
  { q: "Where is your hair now?", opts: [["natural", "Natural, never colored"], ["colored", "Colored before"], ["dark", "Very dark or box dye"]] },
  { q: "How often do you want to be in the chair?", opts: [["low", "As rarely as possible"], ["mid", "Every few months"], ["high", "I love the ritual"]] },
] as const;

function recommend(a: string[]): string {
  const [goal, hist, upkeep] = a;
  if (goal === "cut") return upkeep === "low" ? "cut-signature" : "cut-bob";
  if (goal === "color") return upkeep === "high" ? "color-vivid" : hist === "natural" ? "color-allover" : "color-root";
  if (goal === "lighter") return hist === "dark" && upkeep === "high" ? "blonde-platinum" : upkeep === "mid" && hist !== "dark" ? "blonde-highlights" : "blonde-balayage";
  return upkeep === "low" ? "style-updo" : "style-bridal";
}

function Quiz() {
  const { services } = useContent();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const setService = useBooking((s) => s.setService);
  const done = step >= questions.length;
  const result = done ? (services.find((s) => s.id === recommend(answers)) ?? services[0] ?? null) : null;

  return (
    <div className="glass relative overflow-hidden rounded-3xl p-6 sm:p-8">
      <div className="pointer-events-none absolute -top-20 -right-20 size-64 rounded-full bg-accent/20 blur-3xl" />
      <p className="text-xs tracking-[0.3em] text-counter uppercase">Not sure? 3 questions</p>
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3 }}>
          {!done || !result ? (
            <>
              <h3 className="font-display mt-3 text-3xl font-light">{questions[step].q}</h3>
              <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
                {questions[step].opts.map(([v, label]) => (
                  <button
                    key={v}
                    onClick={() => { setAnswers([...answers, v]); setStep(step + 1); }}
                    className="btn-ghost rounded-xl px-5 py-3.5 text-left text-sm"
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex gap-1.5">{questions.map((_, i) => <span key={i} className={`h-1 w-10 rounded-full ${i <= step ? "bg-accent" : "bg-line"}`} />)}</div>
            </>
          ) : (
            <>
              <h3 className="font-display mt-3 text-3xl font-light">We&rsquo;d start with <span className="text-shade italic">{result.name}</span></h3>
              <p className="mt-3 max-w-lg text-cream/75">{result.blurb}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button className="btn-accent rounded-full px-6 py-3" onClick={() => { setService(result.id); goTab("book"); }}>Book it · from ${result.price}</button>
                <button className="btn-ghost rounded-full px-6 py-3" onClick={() => { setStep(0); setAnswers([]); }}>Start over</button>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function ServicesPanel() {
  const { services, addons } = useContent();
  const [cat, setCat] = useState<ServiceCategory>("Color");
  const [open, setOpen] = useState<string | null>(null);
  const setService = useBooking((s) => s.setService);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div>
        <div className="mb-6 flex gap-6 border-b border-line" role="tablist">
          {categories.map((c) => (
            <button key={c} role="tab" aria-selected={cat === c} onClick={() => { setCat(c); setOpen(null); }} className={`relative pb-3 text-sm tracking-wide ${cat === c ? "text-cream" : "text-muted hover:text-cream"}`}>
              {c}
              {cat === c && <motion.span layoutId="svc-underline" className="absolute inset-x-0 -bottom-px h-0.5 bg-accent" />}
            </button>
          ))}
        </div>

        <ul>
          {services.filter((s) => s.category === cat).map((s, i) => {
            const isOpen = open === s.id;
            return (
              <motion.li key={s.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="border-b border-line">
                <button onClick={() => setOpen(isOpen ? null : s.id)} aria-expanded={isOpen} className="group flex w-full items-baseline gap-3 py-5 text-left">
                  <span className="min-w-0 flex-1 sm:flex-none">
                    <span className="font-display block text-xl transition-colors group-hover:text-accent sm:inline sm:text-2xl">{s.name}</span>
                    <span className="mt-0.5 block text-xs text-muted sm:hidden">{formatDuration(s.minutes)}</span>
                  </span>
                  <span className="mb-1 hidden min-w-4 flex-1 translate-y-[-3px] border-b border-dotted border-cream/20 sm:block" />
                  <span className="hidden text-sm text-muted sm:inline">{formatDuration(s.minutes)}</span>
                  <span className="font-display w-auto shrink-0 text-right text-xl text-accent2 sm:w-20">${s.price}+</span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-center sm:justify-between">
                        <p className="max-w-lg text-cream/70">{s.blurb}{s.deposit ? ` Deposit $${s.deposit}, applied to your total.` : " No deposit required."}</p>
                        <button className="btn-accent shrink-0 rounded-full px-6 py-3 text-sm" onClick={() => { setService(s.id); goTab("book"); }}>Book this</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.li>
            );
          })}
        </ul>

        <div className="mt-10">
          <p className="text-xs tracking-[0.3em] text-muted uppercase">Enhance any service</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {addons.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
                <div><p className="font-medium">{a.name}</p><p className="text-xs text-muted">{a.blurb}</p></div>
                <span className="text-accent2">+${a.price}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start"><Quiz /></div>
    </div>
  );
}
