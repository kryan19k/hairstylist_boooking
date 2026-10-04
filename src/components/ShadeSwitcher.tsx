"use client";
import { motion } from "motion/react";
import { setShade, shades, useShade } from "@/lib/shade";

export default function ShadeSwitcher({ labelled = false }: { labelled?: boolean }) {
  const current = useShade();
  const active = shades.find((s) => s.id === current)!;
  return (
    <div className="flex items-center gap-3" role="radiogroup" aria-label="Choose your hair shade. Recolors the whole site.">
      <div className="flex items-center gap-1.5">
        {shades.map((s) => (
          <button
            key={s.id}
            role="radio"
            aria-checked={current === s.id}
            aria-label={s.name}
            title={s.name}
            onClick={() => setShade(s.id)}
            className="relative grid size-7 place-items-center rounded-full"
          >
            {current === s.id && (
              <motion.span layoutId="shade-ring" className="absolute inset-0 rounded-full border border-cream/80" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
            )}
            <span className="size-4 rounded-full shadow-inner" style={{ background: `linear-gradient(135deg, ${s.accent2}, ${s.accent})` }} />
          </button>
        ))}
      </div>
      {labelled && <span className="hidden w-16 text-xs tracking-[0.2em] text-muted uppercase sm:block">{active.name}</span>}
    </div>
  );
}
