"use client";
import Image from "next/image";
import { motion } from "motion/react";
import { useContent } from "./ContentProvider";
import { goTab } from "@/lib/tabs";
import { useT } from "@/lib/locale";

export function Portrait({ name, src, className = "" }: { name: string; src?: string; className?: string }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("");
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-ink-3 via-accent/30 to-counter/30 ${className}`}>
      {src ? (
        <Image src={src} alt={name} fill sizes="(max-width:768px) 80vw, 360px" className="object-cover transition-transform duration-[1400ms] group-hover:scale-105" />
      ) : (
        <span className="font-display absolute inset-0 grid place-items-center text-7xl font-light text-cream/70 italic">{initials}</span>
      )}
    </div>
  );
}

export default function TeamSection() {
  const { team, settings: s } = useContent();
  const t = useT();
  const members = team;
  if (members.length === 0) return null; // her own profile is the section above; employees appear here once added

  return (
    <section aria-labelledby="team-title" className="relative mx-auto max-w-7xl px-4 pt-16 pb-4 sm:px-8 sm:pt-24 sm:pb-8">
      <div className="mb-8 flex flex-col sm:mb-12 gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs tracking-[0.3em] text-accent uppercase">{t("team.kicker")}</p>
          <h2 id="team-title" className="font-display mt-3 text-5xl font-light sm:text-6xl">{t("team.title1")} <span className="text-shade italic">{t("team.title2")}</span></h2>
        </div>
        <p className="max-w-sm text-cream/70">{t("team.blurb", { name: s.name })}</p>
      </div>

      <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3" style={members.length === 1 ? { gridTemplateColumns: "minmax(0, 22rem)", justifyContent: "center" } : undefined}>
        {members.map((m, i) => (
          <motion.li
            key={m.id}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: i * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="group mx-auto w-full max-w-[17rem] sm:max-w-none"
          >
            <div className="relative">
              <div className="blob-b absolute inset-0 translate-x-3 translate-y-3 border border-accent/40 transition group-hover:translate-x-4 group-hover:translate-y-4" />
              <Portrait name={m.name} src={m.photoUrl} className="blob-morph relative aspect-square" />
            </div>
            <h3 className="font-display mt-6 text-3xl font-light">{m.name}</h3>
            <p className="mt-1 text-xs tracking-[0.25em] text-accent uppercase">{m.role}</p>
            {m.bio && <p className="mt-3 text-cream/70">{m.bio}</p>}
            <div className="mt-4 flex items-center gap-4 text-sm">
              <button onClick={() => goTab("book")} className="text-accent2 underline-offset-4 hover:underline">{t("team.book")}</button>
              {m.instagram && <a href={`https://instagram.com/${m.instagram}`} target="_blank" rel="noreferrer" className="text-muted hover:text-cream">@{m.instagram}</a>}
            </div>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
