"use client";
import { useEffect, useState } from "react";
import { browserClient } from "@/lib/supabase";
import { revalidateSite } from "@/app/actions";
import { mergeSettings, type SiteSettings } from "@/lib/site";
import { useT, useTx, useLocale, intlTag } from "@/lib/locale";
import { shades } from "@/lib/shade";
import { Btn, Field, ImageField, inputCls, Notice } from "./ui";

const order = [2, 3, 4, 5, 6, 0, 1];

export default function SettingsAdmin() {
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

  const setEs = (k: keyof SiteSettings["es"], v: string) => setS({ ...s, es: { ...s.es, [k]: v } });
  const es = (k: keyof SiteSettings["es"], multiline = false) => (
    <span className="mt-2 block">
      <span className="mb-1 block text-[0.62rem] tracking-[0.2em] text-accent uppercase">Español</span>
      {multiline ? (
        <textarea className={`${inputCls} min-h-20`} value={s.es[k] ?? ""} onChange={(e) => setEs(k, e.target.value)} placeholder="Traducción al español" />
      ) : (
        <input className={inputCls} value={s.es[k] ?? ""} onChange={(e) => setEs(k, e.target.value)} placeholder="Traducción al español" />
      )}
    </span>
  );

  const setDay = (d: number, v: [string, string] | null) => set("hours", { ...s.hours, [d]: v });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const { error } = await browserClient().from("site_settings").upsert({ id: 1, data: s });
    setBusy(false);
    if (error) return setMsg({ kind: "error", text: error.message });
    setMsg({ kind: "ok", text: tx("Saved. Your website is updated.") });
    await revalidateSite();
  };

  return (
    <form onSubmit={save} className="space-y-10">
      <div>
        <h2 className="font-display text-3xl font-light">{tx("Studio & website")}</h2>
        <p className="mt-1 text-sm text-muted">{tx("Your name, contact details, hours and the text on your site.")}</p>
      </div>
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}

      <section className="grid gap-4 sm:grid-cols-2">
        <h3 className="font-display text-xl sm:col-span-2">{tx("Salon")}</h3>
        <Field label="Salon name" hint="Big wordmark in the header"><input {...text("name")} /></Field>
        <Field label="Subtitle" hint="Small text beside the name"><input {...text("tagline")} />{es("tagline")}</Field>
        <Field label="Stylist name"><input {...text("stylist")} /></Field>
        <Field label="City"><input {...text("city")} /></Field>
        <Field label="Street address" className="sm:col-span-2"><input {...text("address")} /></Field>
        <Field label="Phone"><input {...text("phone")} placeholder="(951) 555-0123" /></Field>
        <Field label="Email"><input {...text("email")} type="email" /></Field>
        <Field label="Instagram handle" hint="without the @"><input {...text("instagram")} /></Field>
        <Field label="Directions note" hint="e.g. Free parking out front"><input {...text("directionsNote")} />{es("directionsNote")}</Field>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <h3 className="font-display text-xl sm:col-span-2">{tx("Homepage & about")}</h3>
        <Field label="Hero paragraph" className="sm:col-span-2"><textarea {...text("heroBlurb")} className={`${inputCls} min-h-20`} />{es("heroBlurb", true)}</Field>
        <Field label="About headline" className="sm:col-span-2"><input {...text("aboutTitle")} />{es("aboutTitle")}</Field>
        <Field label="About text" className="sm:col-span-2"><textarea {...text("aboutBody")} className={`${inputCls} min-h-32`} />{es("aboutBody", true)}</Field>
        <div className="sm:col-span-2"><ImageField label="Portrait photo" value={s.portraitUrl || null} onChange={(u) => set("portraitUrl", u ?? "")} /></div>
        <Field label="Years of experience"><input {...num("yearsExperience")} /></Field>
        <Field label="Clients served" hint="shown as text, e.g. 4,200+"><input {...text("clientsServed")} /></Field>
        <Field label="Average rating"><input {...num("rating")} /></Field>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <h3 className="font-display text-xl sm:col-span-2">{tx("Look & feel")}</h3>
        <Field label="Default color shade" hint="Visitors can still change it themselves.">
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

      <Btn type="submit" kind="accent" disabled={busy}>{busy ? "Saving…" : "Save changes"}</Btn>
    </form>
  );
}
