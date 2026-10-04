"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import LookArt from "../LookArt";
import { lookCategories, type Look } from "@/lib/data";
import { useContent } from "../ContentProvider";
import { formatDuration } from "@/lib/availability";
import { useBooking } from "@/lib/booking-store";
import { useRouter } from "next/navigation";

function LookImage({ look, muted = false }: { look: Look; muted?: boolean }) {
  const src = muted ? look.before : look.image;
  if (src) return <Image src={src} alt={look.title} fill sizes="(max-width:768px) 100vw, 40vw" className="object-cover" />;
  return <LookArt look={look} muted={muted} className="absolute inset-0 h-full w-full" />;
}

function BeforeAfter({ look }: { look: Look }) {
  const [pos, setPos] = useState(55);
  const box = useRef<HTMLDivElement>(null);
  const drag = (clientX: number) => {
    const r = box.current!.getBoundingClientRect();
    setPos(Math.min(98, Math.max(2, ((clientX - r.left) / r.width) * 100)));
  };
  return (
    <div
      ref={box}
      className="relative aspect-[3/4] w-full cursor-ew-resize touch-none overflow-hidden rounded-2xl select-none"
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); drag(e.clientX); }}
      onPointerMove={(e) => e.buttons && drag(e.clientX)}
    >
      <LookImage look={look} />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <LookImage look={look} muted />
      </div>
      <span className="absolute top-3 left-3 rounded-full bg-ink/70 px-3 py-1 text-[0.65rem] tracking-widest uppercase backdrop-blur">Before</span>
      <span className="absolute top-3 right-3 rounded-full bg-ink/70 px-3 py-1 text-[0.65rem] tracking-widest uppercase backdrop-blur">After</span>
      <div className="absolute inset-y-0 w-0.5 bg-cream" style={{ left: `${pos}%` }}>
        <div className="absolute top-1/2 left-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-cream text-ink shadow-xl">⇆</div>
      </div>
      <input
        type="range" min={2} max={98} value={pos} onChange={(e) => setPos(+e.target.value)}
        aria-label="Reveal before and after" className="sr-only"
      />
    </div>
  );
}

function Lightbox({ look, onClose }: { look: Look; onClose: () => void }) {
  const setService = useBooking((s) => s.setService);
  const router = useRouter();
  const { services } = useContent();
  const service = services.find((s) => s.id === look.serviceId);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = prev; };
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-ink/85 p-4 backdrop-blur-md"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      role="dialog" aria-modal="true" aria-label={look.title}
    >
      <motion.div
        layoutId={`look-${look.id}`}
        onClick={(e) => e.stopPropagation()}
        className="glass grid w-full max-w-4xl gap-0 overflow-hidden rounded-3xl md:grid-cols-2"
      >
        <div className="p-3 md:p-4"><BeforeAfter look={look} /></div>
        <div className="flex flex-col justify-between gap-8 p-6 md:p-8">
          <div>
            <p className="text-xs tracking-[0.3em] text-accent uppercase">{look.category}</p>
            <h3 className="font-display mt-2 text-4xl font-light">{look.title}</h3>
            <p className="mt-4 leading-relaxed text-cream/75">{look.story}</p>
            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
              {service && (
                <>
                  <div><dt className="text-muted">Service</dt><dd className="mt-0.5 font-medium">{service.name}</dd></div>
                  <div><dt className="text-muted">Time in chair</dt><dd className="mt-0.5 font-medium">{formatDuration(service.minutes)}</dd></div>
                  <div><dt className="text-muted">From</dt><dd className="mt-0.5 font-medium">${service.price}</dd></div>
                </>
              )}
              <div><dt className="text-muted">Palette</dt><dd className="mt-1 flex gap-1.5">{look.palette.map((c) => <span key={c} className="size-5 rounded-full ring-1 ring-cream/20" style={{ background: c }} />)}</dd></div>
            </dl>
          </div>
          <div className="flex gap-3">
            <button
              className="btn-accent flex-1 rounded-full px-6 py-3.5"
              onClick={() => { setService(service?.id ?? null, `Inspired by “${look.title}”`); onClose(); router.push("/#book"); }}
            >
              Book this look
            </button>
            <button className="btn-ghost rounded-full px-6 py-3.5" onClick={onClose}>Close</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function WorkPanel() {
  const { looks } = useContent();
  const [cat, setCat] = useState<(typeof lookCategories)[number]>("All");
  const [open, setOpen] = useState<Look | null>(null);
  const shown = cat === "All" ? looks : looks.filter((l) => l.category === cat);

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Filter portfolio">
        {lookCategories.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            aria-pressed={cat === c}
            className={`rounded-full border px-4 py-2 text-sm transition ${cat === c ? "border-accent bg-accent/15 text-accent2" : "border-line text-cream/70 hover:border-cream/40"}`}
          >
            {c}
            <span className="ml-2 text-xs opacity-50">{c === "All" ? looks.length : looks.filter((l) => l.category === c).length}</span>
          </button>
        ))}
      </div>

      <motion.div layout className="columns-2 gap-3 sm:gap-5 lg:columns-3">
        <AnimatePresence mode="popLayout">
          {shown.map((look, i) => (
            <motion.button
              layout
              layoutId={`look-${look.id}`}
              key={look.id}
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: i * 0.04, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => setOpen(look)}
              className="group relative mb-3 block w-full overflow-hidden rounded-2xl text-left sm:mb-5"
              style={{ aspectRatio: i % 3 === 1 ? "3 / 4.2" : i % 3 === 2 ? "3 / 3.6" : "3 / 4" }}
            >
              <div className="absolute inset-0 transition-transform duration-[1200ms] ease-out group-hover:scale-110"><LookImage look={look} /></div>
              <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/10 to-transparent opacity-80 transition group-hover:opacity-100" />
              <div className="absolute inset-x-0 bottom-0 translate-y-2 p-4 transition duration-500 group-hover:translate-y-0 sm:p-5">
                <p className="text-[0.65rem] tracking-[0.25em] text-accent2 uppercase">{look.category}</p>
                <p className="font-display mt-1 text-xl sm:text-2xl">{look.title}</p>
                <p className="mt-1 max-h-0 overflow-hidden text-xs text-cream/70 opacity-0 transition-all duration-500 group-hover:max-h-12 group-hover:opacity-100">Tap to compare before &amp; after →</p>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </motion.div>
      <p className="mt-6 text-center text-xs text-muted">{looks.some((l) => l.image) ? "" : "Illustrative previews. Real client photography drops in here."}</p>
      <AnimatePresence>{open && <Lightbox look={open} onClose={() => setOpen(null)} />}</AnimatePresence>
    </div>
  );
}
