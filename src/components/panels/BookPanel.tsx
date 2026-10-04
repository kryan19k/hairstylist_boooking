"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { categories } from "@/lib/data";
import { useContent } from "../ContentProvider";
import { useSlotOpts } from "@/lib/use-slots";
import { dateKey, formatTime, getSlots, hoursFor, parseDateKey, type Busy } from "@/lib/availability";
import { useBooking } from "@/lib/booking-store";
import { createBooking, getBusy, type BookingResult } from "@/app/actions";
import { useT, useLocale, useDuration, intlTag } from "@/lib/locale";

const steps = ["service", "time", "details"] as const;
type Done = Extract<BookingResult, { ok: true }>;

const longDate = (key: string, tag: string) => parseDateKey(key).toLocaleDateString(tag, { weekday: "long", month: "long", day: "numeric" });

function useSummary() {
  const { services, addons } = useContent();
  const { serviceId, addonIds } = useBooking();
  const service = services.find((s) => s.id === serviceId) ?? null;
  const picked = addons.filter((a) => addonIds.includes(a.id));
  const minutes = (service?.minutes ?? 0) + picked.reduce((n, a) => n + a.minutes, 0);
  const total = (service?.price ?? 0) + picked.reduce((n, a) => n + a.price, 0);
  return { service, picked, minutes, total };
}

/* The cream "receipt" that builds itself as you choose. */
function Ticket({ summary, opts }: { summary: ReturnType<typeof useSummary>; opts: ReturnType<typeof useSlotOpts> }) {
  const { settings: site } = useContent();
  const t = useT();
  const dur = useDuration();
  const tag = intlTag(useLocale());
  const { date, time } = useBooking();
  const { service, picked, minutes, total } = summary;
  const end = date && time ? getSlots(date, minutes, opts).find((s) => s.time === time)?.endsAt : null;
  return (
    <div className="paper relative rounded-[2.75rem] p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] [mask-image:radial-gradient(circle_9px_at_0_62%,transparent_98%,#000),radial-gradient(circle_9px_at_100%_62%,transparent_98%,#000)] [mask-composite:intersect]">
      <div className="flex items-baseline justify-between">
        <p className="font-display text-xl">{site.name}</p>
        <p className="text-[0.65rem] tracking-[0.3em] uppercase opacity-60">{t("ticket.title")}</p>
      </div>
      <div className="mt-5 min-h-24 space-y-3 text-sm">
        {service ? (
          <>
            <Row label={service.name} value={`$${service.price}`} strong />
            {picked.map((a) => <Row key={a.id} label={`+ ${a.name}`} value={`$${a.price}`} />)}
          </>
        ) : (
          <p className="opacity-50">{t("ticket.empty")}</p>
        )}
      </div>
      <div className="my-5 border-t border-dashed border-paper-ink/25" />
      <div className="space-y-3 text-sm">
        <Row label={t("ticket.when")} value={date && time ? `${parseDateKey(date).toLocaleDateString(tag, { month: "short", day: "numeric" })} · ${formatTime(time)}${end ? ` – ${formatTime(end)}` : ""}` : "—"} />
        <Row label={t("ticket.chair")} value={minutes ? dur(minutes) : "—"} />
        <Row label={t("ticket.depositToday")} value={service ? (service.deposit ? `$${service.deposit}` : t("ticket.none")) : "—"} />
      </div>
      <div className="mt-5 flex items-end justify-between border-t border-paper-ink/20 pt-4">
        <span className="text-xs tracking-[0.25em] uppercase opacity-60">{t("ticket.total")}</span>
        <motion.span key={total} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="font-display text-4xl">${total}</motion.span>
      </div>
      <p className="mt-3 text-[0.7rem] leading-snug opacity-55">{t("ticket.note")}</p>
    </div>
  );
}
const Row = ({ label, value, strong }: { label: string; value: string; strong?: boolean }) => (
  <div className="flex justify-between gap-4"><span className={strong ? "font-semibold" : "opacity-70"}>{label}</span><span className={strong ? "font-semibold" : ""}>{value}</span></div>
);

/* ---- Step 1 ---- */
function StepService({ onNext }: { onNext: () => void }) {
  const { services, addons } = useContent();
  const t = useT();
  const dur = useDuration();
  const { serviceId, addonIds, setService, toggleAddon, note } = useBooking();
  const [cat, setCat] = useState(() => services.find((s) => s.id === serviceId)?.category ?? "Color");
  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`rounded-full border px-4 py-1.5 text-sm transition ${cat === c ? "border-accent bg-accent/15 text-accent2" : "border-line text-cream/70"}`}>{t(`cat.${c}`)}</button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={t("book.serviceAria")}>
        {services.filter((s) => s.category === cat).map((s) => {
          const on = serviceId === s.id;
          return (
            <button key={s.id} role="radio" aria-checked={on} onClick={() => setService(s.id, note)}
              className={`relative rounded-[2rem] border p-5 text-left transition ${on ? "border-accent bg-accent/10" : "border-line hover:border-cream/40"}`}>
              <div className="flex items-start justify-between gap-3">
                <p className="font-display text-xl leading-tight">{s.name}</p>
                <span className="text-accent2">${s.price}+</span>
              </div>
              <p className="mt-2 text-sm text-cream/65">{s.blurb}</p>
              <p className="mt-3 text-xs text-muted">{dur(s.minutes)}{s.deposit ? ` · ${t("book.depositSmall", { amount: s.deposit })}` : ""}</p>
              {on && <motion.span layoutId="svc-check" className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-accent text-xs text-on-accent">✓</motion.span>}
            </button>
          );
        })}
      </div>
      <AnimatePresence>
        {serviceId && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <p className="mt-8 text-xs tracking-[0.3em] text-muted uppercase">{t("book.add")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {addons.map((a) => {
                const on = addonIds.includes(a.id);
                return (
                  <button key={a.id} aria-pressed={on} onClick={() => toggleAddon(a.id)} className={`rounded-full border px-4 py-2 text-sm transition ${on ? "border-counter bg-counter/15 text-counter" : "border-line text-cream/70 hover:border-cream/40"}`}>
                    {on ? "✓ " : "+ "}{a.name} <span className="opacity-60">${a.price}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mt-10"><button disabled={!serviceId} onClick={onNext} className="btn-accent rounded-full px-8 py-3.5">{t("book.chooseTime")}</button></div>
    </div>
  );
}

/* ---- Step 2 ---- */
function StepTime({ minutes, opts, onBack, onNext }: { minutes: number; opts: ReturnType<typeof useSlotOpts>; onBack: () => void; onNext: () => void }) {
  const t = useT();
  const dur = useDuration();
  const tag = intlTag(useLocale());
  const { date, time, setSlot } = useBooking();
  const [now] = useState(() => new Date());
  const days = useMemo(() => Array.from({ length: 42 }, (_, i) => dateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() + i))), [now]);
  const [sel, setSel] = useState(() => date ?? days.find((d) => getSlots(d, minutes, { ...opts, now }).some((s) => !s.taken)) ?? days[0]);
  const slots = getSlots(sel, minutes, { ...opts, now });
  const free = slots.filter((s) => !s.taken);
  const groups = [
    [t("book.morning"), free.filter((s) => s.time < "12:00")],
    [t("book.afternoon"), free.filter((s) => s.time >= "12:00" && s.time < "17:00")],
    [t("book.evening"), free.filter((s) => s.time >= "17:00")],
  ] as const;

  return (
    <div>
      <div className="scroll-hide -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0" role="listbox" aria-label={t("book.dateAria")}>
        {days.map((d) => {
          const dt = parseDateKey(d);
          const open = !!hoursFor(d, opts.hours);
          const avail = open && getSlots(d, minutes, { ...opts, now }).some((s) => !s.taken);
          const on = sel === d;
          return (
            <button key={d} role="option" aria-selected={on} disabled={!avail} onClick={() => setSel(d)}
              className={`relative flex w-16 shrink-0 flex-col items-center rounded-[2rem] border py-3 transition ${on ? "border-accent bg-accent text-on-accent" : avail ? "border-line hover:border-cream/40" : "border-transparent opacity-30"}`}>
              <span className="text-[0.65rem] tracking-widest uppercase opacity-70">{dt.toLocaleDateString(tag, { weekday: "short" })}</span>
              <span className="font-display text-2xl">{dt.getDate()}</span>
              <span className="text-[0.65rem] opacity-70">{dt.toLocaleDateString(tag, { month: "short" })}</span>
              {avail && !on && <span className="absolute bottom-1.5 size-1 rounded-full bg-counter" />}
            </button>
          );
        })}
      </div>

      <p className="mt-8 font-display text-2xl">{longDate(sel, tag)}</p>
      <p className="text-sm text-muted">{t("book.apptLine", { dur: dur(minutes) })}</p>

      <AnimatePresence mode="wait">
        <motion.div key={sel} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5 space-y-6">
          {free.length === 0 && <p className="text-cream/60">{t("book.none")}</p>}
          {groups.map(([label, list]) => list.length > 0 && (
            <div key={label}>
              <p className="mb-2 text-xs tracking-[0.25em] text-muted uppercase">{label}</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                {list.map((s) => {
                  const on = date === sel && time === s.time;
                  return (
                    <button key={s.time} aria-pressed={on} onClick={() => setSlot(sel, s.time)}
                      className={`rounded-[1.6rem] border py-2.5 text-sm transition ${on ? "border-accent bg-accent font-semibold text-on-accent" : "border-line hover:border-accent/60 hover:bg-accent/10"}`}>
                      {formatTime(s.time)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </motion.div>
      </AnimatePresence>

      <div className="mt-10 flex gap-3">
        <button onClick={onBack} className="btn-ghost rounded-full px-6 py-3.5">{t("common.back")}</button>
        <button disabled={!date || !time} onClick={onNext} className="btn-accent rounded-full px-8 py-3.5">{t("book.yourDetails")}</button>
      </div>
    </div>
  );
}

/* ---- Step 3 ---- */
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs tracking-[0.2em] text-muted uppercase">{label}</span>
      {children}
      {error && <span role="alert" className="mt-1 block text-xs text-[#ff8f8f]">{error}</span>}
    </label>
  );
}
const input = "w-full rounded-[1.6rem] border border-line bg-ink-2/60 px-4 py-3 text-cream placeholder:text-cream/30 transition focus:border-accent";

function StepDetails({ onBack, onDone }: { onBack: () => void; onDone: (d: Done) => void }) {
  const t = useT();
  const { serviceId, addonIds, date, time, note } = useBooking();
  const [form, setForm] = useState({ name: "", email: "", phone: "", firstVisit: true, notes: note, website: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [pending, start] = useTransition();
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (form.name.trim().length < 2) er.name = t("book.err.name");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) er.email = t("book.err.email");
    if (form.phone.replace(/\D/g, "").length < 7) er.phone = t("book.err.phone");
    setErrors(er);
    if (Object.keys(er).length || !serviceId || !date || !time) return;
    setServerError("");
    start(async () => {
      const res = await createBooking({ serviceId, addonIds, date, time, ...form });
      if (res.ok) onDone(res);
      else setServerError(res.code ? t(`err.${res.code}`) : res.error);
    });
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t("book.name")} error={errors.name}><input className={input} value={form.name} onChange={set("name")} autoComplete="name" placeholder="Jane Doe" /></Field>
        <Field label={t("book.phone")} error={errors.phone}><input className={input} value={form.phone} onChange={set("phone")} autoComplete="tel" inputMode="tel" placeholder="(555) 000-0000" /></Field>
      </div>
      <Field label={t("book.email")} error={errors.email}><input className={input} value={form.email} onChange={set("email")} autoComplete="email" inputMode="email" placeholder="you@email.com" /></Field>
      <Field label={t("book.notes")}>
        <textarea className={`${input} min-h-28 resize-y`} value={form.notes} onChange={set("notes")} maxLength={1000} placeholder={t("book.notesPh")} />
      </Field>
      {/* honeypot */}
      <input tabIndex={-1} autoComplete="off" aria-hidden value={form.website} onChange={set("website")} className="absolute -left-[9999px] h-0 w-0 opacity-0" name="website" />
      <label className="flex cursor-pointer items-center gap-3 text-sm text-cream/80">
        <input type="checkbox" checked={form.firstVisit} onChange={(e) => setForm({ ...form, firstVisit: e.target.checked })} className="size-4 accent-[var(--accent)]" />
        {t("book.first")}
      </label>
      {serverError && <p role="alert" className="rounded-[1.6rem] border border-[#ff8f8f]/40 bg-[#ff8f8f]/10 px-4 py-3 text-sm text-[#ffb3b3]">{serverError}</p>}
      <p className="text-xs text-muted">{t("book.policy")}</p>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onBack} className="btn-ghost rounded-full px-6 py-3.5">{t("common.back")}</button>
        <button type="submit" disabled={pending} className="btn-accent rounded-full px-8 py-3.5">{pending ? t("book.confirming") : t("book.confirm")}</button>
      </div>
    </form>
  );
}

/* ---- Confirmation ---- */
function ics(done: Done, serviceName: string, date: string, time: string, site: { name: string; address: string }, t: (k: string, v?: Record<string, string | number>) => string) {
  const [y, m, d] = date.split("-");
  const [hh, mm] = time.split(":").map(Number);
  const end = hh * 60 + mm + done.minutes;
  const stamp = (mins: number) => `${y}${m}${d}T${String(Math.floor(mins / 60)).padStart(2, "0")}${String(mins % 60).padStart(2, "0")}00`;
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Salon Booking//EN", "BEGIN:VEVENT",
    `UID:${done.ref}@booking`, `DTSTAMP:${stamp(0).slice(0, 8)}T000000`,
    `DTSTART:${stamp(hh * 60 + mm)}`, `DTEND:${stamp(end)}`,
    `SUMMARY:${t("book.calTitle", { service: serviceName, name: site.name })}`, `LOCATION:${site.address.replace(/,/g, "\\,")}`,
    `DESCRIPTION:${t("book.calDesc", { ref: done.ref })}`, "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
}

function Confirmed({ done, serviceName, date, time, onAgain }: { done: Done; serviceName: string; date: string; time: string; onAgain: () => void }) {
  const { settings: site } = useContent();
  const t = useT();
  const tag = intlTag(useLocale());
  const download = () => {
    const url = URL.createObjectURL(new Blob([ics(done, serviceName, date, time, site, t)], { type: "text/calendar" }));
    const a = document.createElement("a");
    a.href = url; a.download = `${site.name}-${done.ref}.ics`; a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto max-w-xl text-center">
      <svg viewBox="0 0 80 80" className="mx-auto size-24" aria-hidden>
        <motion.circle cx="40" cy="40" r="36" fill="none" stroke="var(--accent)" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8 }} />
        <motion.path d="M24 41 l11 11 l22 -24" fill="none" stroke="var(--counter)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.6, duration: 0.5 }} />
      </svg>
      <h3 className="font-display mt-6 text-5xl font-light">{t("book.done1")} <span className="text-shade italic">{t("book.done2")}</span></h3>
      <p className="mt-4 text-cream/75">{serviceName} · {longDate(date, tag)} · {formatTime(time)}</p>
      <p className="mt-1 text-sm text-muted">{t("book.ref")} <span className="font-mono tracking-widest text-accent2">{done.ref}</span> · {t("book.confirmNote")}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button onClick={download} className="btn-accent rounded-full px-7 py-3.5">{t("book.cal")}</button>
        <button onClick={onAgain} className="btn-ghost rounded-full px-7 py-3.5">{t("book.another")}</button>
      </div>
    </motion.div>
  );
}

/* ---- Shell ---- */
function Skeleton() {
  return <div className="grid gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]"><div className="h-96 animate-pulse rounded-[2.75rem] bg-ink-3/60" /><div className="h-96 animate-pulse rounded-[2.75rem] bg-ink-3/60" /></div>;
}

function BookFlow({ live }: { live: Busy[] }) {
  const t = useT();
  const dur = useDuration();
  const tag = intlTag(useLocale());
  const opts = useSlotOpts(live);
  const [step, setStep] = useState<number>(() => (useBooking.getState().serviceId ? 1 : 0));
  const [done, setDone] = useState<{ result: Done; serviceName: string; date: string; time: string } | null>(null);
  const summary = useSummary();
  const { date, time, reset } = useBooking();

  if (done) {
    return <Confirmed done={done.result} serviceName={done.serviceName} date={done.date} time={done.time} onAgain={() => { reset(); setDone(null); setStep(0); }} />;
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <div className="min-w-0">
        {/* phones: a slim running total instead of the full receipt below the form */}
        {summary.service && (
          <div className="mb-6 flex items-center justify-between gap-3 rounded-[2rem] border border-line bg-ink-2 px-4 py-3 text-sm lg:hidden">
            <span className="min-w-0 truncate">
              <span className="font-medium">{summary.service.name}</span>
              <span className="text-muted">{date && time ? ` · ${parseDateKey(date).toLocaleDateString(tag, { month: "short", day: "numeric" })}, ${formatTime(time)}` : ` · ${dur(summary.minutes)}`}</span>
            </span>
            <span className="font-display shrink-0 text-xl text-accent2">${summary.total}</span>
          </div>
        )}
        <ol className="mb-8 flex items-center gap-3 sm:mb-10" aria-label={t("book.progress")}>
          {steps.map((s, i) => (
            <li key={s} className="flex flex-1 items-center gap-3 last:flex-none">
              <button
                disabled={i > step}
                onClick={() => setStep(i)}
                aria-current={i === step ? "step" : undefined}
                className={`flex items-center gap-2.5 text-sm ${i === step ? "text-cream" : i < step ? "text-accent2" : "text-muted"}`}
              >
                <span className={`grid size-7 place-items-center rounded-full border text-xs ${i === step ? "border-accent bg-accent text-on-accent" : i < step ? "border-accent2" : "border-line"}`}>{i < step ? "✓" : i + 1}</span>
                <span className="hidden sm:inline">{t(`book.step.${s}`)}</span>
              </button>
              {i < steps.length - 1 && <span className="relative h-px flex-1 bg-line"><motion.span className="absolute inset-y-0 left-0 bg-accent" animate={{ width: i < step ? "100%" : "0%" }} /></span>}
            </li>
          ))}
        </ol>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
            {step === 0 && <StepService onNext={() => setStep(1)} />}
            {step === 1 && <StepTime minutes={summary.minutes} opts={opts} onBack={() => setStep(0)} onNext={() => setStep(2)} />}
            {step === 2 && (
              <StepDetails
                onBack={() => setStep(1)}
                onDone={(result) => setDone({ result, serviceName: summary.service!.name, date: date!, time: time! })}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      <aside className={`lg:sticky lg:top-24 lg:self-start ${step === 2 ? "" : "hidden lg:block"}`}><Ticket summary={summary} opts={opts} /></aside>
    </div>
  );
}

export default function BookPanel() {
  // Fetch the freshest busy times each time the tab opens (page content is cached ~30s).
  const [busy, setBusy] = useState<Busy[] | null>(null);
  useEffect(() => {
    let alive = true;
    getBusy().then((b) => alive && setBusy(b)).catch(() => alive && setBusy([]));
    return () => { alive = false; };
  }, []);
  return busy ? <BookFlow live={busy} /> : <Skeleton />;
}
