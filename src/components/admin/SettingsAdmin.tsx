"use client";
import { useEffect, useState } from "react";
import { browserClient } from "@/lib/supabase";
import { revalidateSite } from "@/app/actions";
import { mergeSettings, type AftercareTip, type EsKey, type SiteSettings } from "@/lib/site";
import { dict } from "@/lib/i18n";
import { useT, useTx, useLocale, intlTag } from "@/lib/locale";
import { shades } from "@/lib/shades";
import { Btn, Field, ImageField, inputCls, Notice } from "./ui";

export type Section = "profile" | "text" | "shop";
const order = [2, 3, 4, 5, 6, 0, 1];

const heading: Record<Section, [string, string]> = {
  profile: ["Stylist profile", "The “Meet Fabiola” section on the homepage: her photo, name, headline, bio and the labels around it."],
  text: ["Page text", "The hero headline, the ticker under it, the aftercare tips and the gift cards on the Studio tab."],
  shop: ["Salon & contact", "Salon name, address, phone, hours and booking rules."],
};

export default function SettingsAdmin({ section }: { section: Section }) {
  const tx = useTx();
  const t = useT();
  const tag = intlTag(useLocale());
  const dayName = (d: number) => new Date(2024, 0, 7 + d).toLocaleDateString(tag, { weekday: "long" });
  const [s, setS] = useState<SiteSettings | null>(null);
  const [msg, setMsg] = useState<{ kind: "error" | "ok"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    browserClient().from("site_settings").select("data").eq("id", 1).maybeSingle().then(({ data, error }) => {
      if (error) setMsg({ kind: "error", text: error.message });
      setS(mergeSettings(data?.data));
    });
  }, []);

  if (!s) return <p className="text-muted">{tx("Loading…")}</p>;
  const set = <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => setS({ ...s, [k]: v });
  const text = (k: keyof SiteSettings) => ({ className: inputCls, value: String(s[k] ?? ""), onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(k, e.target.value as never) });
  const num = (k: keyof SiteSettings) => ({ className: inputCls, type: "number", step: "any", value: String(s[k]), onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(k, Number(e.target.value) as never) });

  const setEs = (k: EsKey, v: string) => setS({ ...s, es: { ...s.es, [k]: v } });
  const esBox = (k: EsKey, rows = 0) => (
    <span className="mt-2 block">
      <span className="mb-1 block text-[0.62rem] tracking-[0.2em] text-accent uppercase">Español</span>
      {rows ? (
        <textarea className={inputCls} rows={rows} value={s.es[k] ?? ""} onChange={(e) => setEs(k, e.target.value)} placeholder="Traducción al español" />
      ) : (
        <input className={inputCls} value={s.es[k] ?? ""} onChange={(e) => setEs(k, e.target.value)} placeholder="Traducción al español" />
      )}
    </span>
  );
  /** English input + its Spanish box, in one field. */
  const tr = (k: Extract<keyof SiteSettings, EsKey>, label: string, o: { hint?: string; rows?: number; className?: string; placeholder?: string } = {}) => (
    <Field label={label} hint={o.hint} className={o.className}>
      {o.rows ? <textarea {...text(k)} rows={o.rows} placeholder={o.placeholder} /> : <input {...text(k)} placeholder={o.placeholder} />}
      {esBox(k, o.rows)}
    </Field>
  );

  const setDay = (d: number, v: [string, string] | null) => set("hours", { ...s.hours, [d]: v });
  const setTip = (i: number, patch: Partial<AftercareTip>) => set("aftercare", s.aftercare.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const builtInTips = (): AftercareTip[] =>
    [1, 2, 3, 4].map((n) => ({ t: dict.en[`care.${n}.t`], b: dict.en[`care.${n}.b`], tEs: dict.es[`care.${n}.t`], bEs: dict.es[`care.${n}.b`] }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    // Always save the latest copy of the whole settings row so tabs never overwrite each other.
    const fresh = await browserClient().from("site_settings").select("data").eq("id", 1).maybeSingle();
    const current = mergeSettings(fresh.data?.data);
    const keys: Record<Section, (keyof SiteSettings)[]> = {
      profile: ["stylist", "portraitUrl", "aboutTitle", "aboutBody", "aboutKicker", "aboutMeet", "aboutCta", "yearsExperience", "clientsServed", "rating"],
      text: ["heroWord1", "heroWord2", "heroWord3", "heroBlurb", "marquee", "aftercare", "showGiftCards", "giftAmounts"],
      shop: ["name", "tagline", "city", "address", "phone", "email", "instagram", "directionsNote", "defaultTheme", "defaultShade", "hours", "slotStepMinutes", "leadHours"],
    };
    const next: SiteSettings = { ...current, es: { ...current.es } };
    for (const k of keys[section]) (next as Record<string, unknown>)[k] = s[k];
    const esKeys: Record<Section, EsKey[]> = {
      profile: ["aboutTitle", "aboutBody", "aboutKicker", "aboutMeet", "aboutCta"],
      text: ["heroWord1", "heroWord2", "heroWord3", "heroBlurb", "marquee"],
      shop: ["tagline", "directionsNote"],
    };
    for (const k of esKeys[section]) next.es[k] = s.es[k] ?? "";
    const { error } = await browserClient().from("site_settings").upsert({ id: 1, data: next });
    setBusy(false);
    if (error) return setMsg({ kind: "error", text: error.message });
    setMsg({ kind: "ok", text: tx("Saved. Your website is updated.") });
    await revalidateSite();
  };

  const [title, blurb] = heading[section];
  return (
    <form onSubmit={save} className="space-y-10">
      <div>
        <h2 className="font-display text-3xl font-light">{tx(title)}</h2>
        <p className="mt-1 max-w-xl text-sm text-muted">{tx(blurb)}</p>
      </div>
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}

      {section === "profile" && (
        <>
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><ImageField label="Portrait photo" value={s.portraitUrl || null} onChange={(u) => set("portraitUrl", u ?? "")} /></div>
            <Field label="Stylist name" hint="Shown in the “Meet …” heading (first name) and the hero."><input {...text("stylist")} /></Field>
            <span className="hidden sm:block" />
            {tr("aboutTitle", "About headline", { className: "sm:col-span-2" })}
            {tr("aboutBody", "About text", { rows: 6, className: "sm:col-span-2" })}
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <h3 className="font-display text-xl sm:col-span-2">{tx("Labels around it")}</h3>
            {tr("aboutKicker", "Small label above the heading", { hint: "Blank = “Your stylist”." })}
            {tr("aboutMeet", "Word before the name", { hint: "Blank = “Meet”." })}
            {tr("aboutCta", "Button text", { hint: "Blank = “Book a consultation”." })}
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            <h3 className="font-display text-xl sm:col-span-3">{tx("The three numbers")}</h3>
            <Field label="Years of experience"><input {...num("yearsExperience")} /></Field>
            <Field label="Clients served" hint="shown as text, e.g. 4,200+"><input {...text("clientsServed")} /></Field>
            <Field label="Average rating"><input {...num("rating")} /></Field>
          </section>
        </>
      )}

      {section === "text" && (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <h3 className="font-display text-xl sm:col-span-3">{tx("Hero headline")}</h3>
            {tr("heroWord1", "Word 1", { hint: "Blank = built-in text.", placeholder: "Your" })}
            {tr("heroWord2", "Word 2 (colored)", { placeholder: "color," })}
            {tr("heroWord3", "Word 3", { placeholder: "composed." })}
            {tr("heroBlurb", "Hero paragraph", { rows: 3, className: "sm:col-span-3" })}
          </section>

          <section>
            <h3 className="mb-3 font-display text-xl">{tx("Ticker under the hero")}</h3>
            {tr("marquee", "Ticker words", { hint: "Separate with commas. Blank = built-in list.", rows: 3, placeholder: "Balayage, Precision Cuts, Vivid Color, Bridal" })}
          </section>

          <section>
            <h3 className="font-display text-xl">{tx("Aftercare tips")}</h3>
            <p className="mb-4 text-sm text-muted">{tx("Shown at the bottom of the Studio tab.")}</p>
            {s.aftercare.length === 0 ? (
              <div className="space-y-3">
                <Notice kind="info">Using the built-in four tips.</Notice>
                <Btn onClick={() => set("aftercare", builtInTips())}>Customize the tips</Btn>
              </div>
            ) : (
              <ul className="space-y-3">
                {s.aftercare.map((tip, i) => (
                  <li key={i} className="space-y-3 rounded-2xl border border-line bg-ink-2 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-display text-xl text-accent">{String(i + 1).padStart(2, "0")}</span>
                      <Btn small kind="danger" onClick={() => set("aftercare", s.aftercare.filter((_, j) => j !== i))}>Delete</Btn>
                    </div>
                    <Field label="Title"><input className={inputCls} value={tip.t} onChange={(e) => setTip(i, { t: e.target.value })} /><input className={`${inputCls} mt-2`} value={tip.tEs ?? ""} onChange={(e) => setTip(i, { tEs: e.target.value })} placeholder="Español" /></Field>
                    <Field label="Tip"><textarea className={inputCls} rows={2} value={tip.b} onChange={(e) => setTip(i, { b: e.target.value })} /><textarea className={`${inputCls} mt-2`} rows={2} value={tip.bEs ?? ""} onChange={(e) => setTip(i, { bEs: e.target.value })} placeholder="Español" /></Field>
                  </li>
                ))}
              </ul>
            )}
            {s.aftercare.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-3">
                <Btn onClick={() => set("aftercare", [...s.aftercare, { t: "", b: "", tEs: "", bEs: "" }])}>+ Add a tip</Btn>
                <Btn kind="danger" onClick={() => set("aftercare", [])}>Back to the built-in tips</Btn>
              </div>
            )}
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <h3 className="font-display text-xl sm:col-span-2">{tx("Gift cards")}</h3>
            <label className="flex items-center gap-3 text-sm sm:col-span-2">
              <input type="checkbox" className="size-4 accent-[var(--accent)]" checked={s.showGiftCards} onChange={(e) => set("showGiftCards", e.target.checked)} />
              {tx("Show the gift card box")}
            </label>
            <Field label="Gift card amounts ($)" hint="Separate with commas."><input {...text("giftAmounts")} /></Field>
          </section>
        </>
      )}

      {section === "shop" && (
        <>
          <section className="grid gap-4 sm:grid-cols-2">
            <Field label="Salon name" hint="Big wordmark in the header"><input {...text("name")} /></Field>
            {tr("tagline", "Subtitle", { hint: "Small text beside the name" })}
            <Field label="City"><input {...text("city")} /></Field>
            <Field label="Street address"><input {...text("address")} /></Field>
            <Field label="Phone"><input {...text("phone")} placeholder="(951) 555-0123" /></Field>
            <Field label="Email"><input {...text("email")} type="email" /></Field>
            <Field label="Instagram handle" hint="without the @"><input {...text("instagram")} /></Field>
            {tr("directionsNote", "Directions note", { hint: "e.g. Free parking out front" })}
            <Field label="Default hair color" hint="Visitors can still change it themselves.">
              <select className={inputCls} value={s.defaultShade} onChange={(e) => set("defaultShade", e.target.value)}>
                {shades.map((x) => <option key={x.id} value={x.id}>{t(`shade.${x.id}`)}</option>)}
              </select>
            </Field>
            <Field label="Default mode">
              <select className={inputCls} value={s.defaultTheme} onChange={(e) => set("defaultTheme", e.target.value as "light" | "dark")}>
                <option value="light">{tx("Ivory (light)")}</option>
                <option value="dark">{tx("Black (dark)")}</option>
              </select>
            </Field>
          </section>

          <section>
            <h3 className="font-display text-xl">{tx("Opening hours")}</h3>
            <p className="mb-4 text-sm text-muted">{tx("Clients can only book inside these hours.")}</p>
            <ul className="divide-y divide-line rounded-2xl border border-line bg-ink-2">
              {order.map((d) => {
                const h = s.hours[d];
                return (
                  <li key={d} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <span className="w-28 text-sm font-medium capitalize">{dayName(d)}</span>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" className="size-4 accent-[var(--accent)]" checked={!h} onChange={(e) => setDay(d, e.target.checked ? null : ["10:00", "18:00"])} /> {tx("Closed")}
                    </label>
                    {h && (
                      <span className="flex items-center gap-2">
                        <input aria-label={`${dayName(d)} ${tx("opens")}`} type="time" className={`${inputCls} w-auto`} value={h[0]} onChange={(e) => setDay(d, [e.target.value, h[1]])} />
                        <span className="text-muted">{tx("to")}</span>
                        <input aria-label={`${dayName(d)} ${tx("closes")}`} type="time" className={`${inputCls} w-auto`} value={h[1]} onChange={(e) => setDay(d, [h[0], e.target.value])} />
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Time between start times (minutes)"><input {...num("slotStepMinutes")} /></Field>
              <Field label="Minimum notice (hours)" hint="Stops same-hour bookings"><input {...num("leadHours")} /></Field>
            </div>
          </section>
        </>
      )}

      <Btn type="submit" kind="accent" disabled={busy}>{busy ? "Saving…" : "Save changes"}</Btn>
    </form>
  );
}
