"use client";
import { setLocale, useLocale, useT } from "@/lib/locale";

/** EN | ES pill. */
export default function LangToggle() {
  const locale = useLocale();
  const t = useT();
  return (
    <div role="group" aria-label={t("lang.switch")} className="glass flex items-center rounded-full p-0.5 text-[0.7rem] font-semibold tracking-wider">
      {(["en", "es"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          lang={l}
          className={`rounded-full px-2.5 py-1.5 uppercase transition ${locale === l ? "bg-gradient-to-br from-accent2 to-accent text-on-accent" : "text-cream/70 hover:text-cream"}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
