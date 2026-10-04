"use client";
import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

const BASE_TILT = 28; // leans like a brush mid-stroke
const TIP_X = 15;
const TIP_Y = 31;

// A compact paddle-brush cursor that only exists over the hero, where it combs the strands.
// Everywhere else the normal pointer is used. Bristle tip = pointer hotspot.
export default function HairBrush() {
  const [shown, setShown] = useState(false);
  const [press, setPress] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 900, damping: 46, mass: 0.35 });
  const sy = useSpring(y, { stiffness: 900, damping: 46, mass: 0.35 });
  const tilt = useMotionValue(BASE_TILT);
  const rot = useSpring(tilt, { stiffness: 170, damping: 15 });

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine) and (hover: hover)").matches) return;
    const root = document.documentElement;
    let idle: ReturnType<typeof setTimeout>;

    const move = (e: PointerEvent) => {
      const t = e.target as Element | null;
      // Over the hero, but not over its buttons/controls (those keep the normal hand cursor).
      const inHero = !!t?.closest("#hero") && !t?.closest("a, button, [role='radio'], input");
      root.classList.toggle("has-brush", inHero);
      setShown(inHero);
      if (!inHero) return;
      x.set(e.clientX);
      y.set(e.clientY);
      tilt.set(BASE_TILT - Math.max(-26, Math.min(26, e.movementX * 1.5)));
      clearTimeout(idle);
      idle = setTimeout(() => tilt.set(BASE_TILT), 90);
    };
    const down = () => setPress(true);
    const up = () => setPress(false);
    const leave = () => { root.classList.remove("has-brush"); setShown(false); };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    document.documentElement.addEventListener("mouseleave", leave);
    return () => {
      clearTimeout(idle);
      root.classList.remove("has-brush");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      document.documentElement.removeEventListener("mouseleave", leave);
    };
  }, [x, y, tilt]);

  return (
    <motion.div aria-hidden className="pointer-events-none fixed top-0 left-0 z-[100]" style={{ x: sx, y: sy, opacity: shown ? 1 : 0, transition: "opacity .12s" }}>
      <motion.div
        style={{ rotate: rot, transformOrigin: `${TIP_X}px ${TIP_Y}px`, left: -TIP_X, top: -TIP_Y, position: "absolute" }}
        animate={{ scale: press ? 0.9 : 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 22 }}
      >
        <svg width="30" height="34" viewBox="0 0 30 34" style={{ overflow: "visible", filter: "drop-shadow(0 3px 4px rgb(0 0 0 / .3))" }}>
          <defs>
            <linearGradient id="hb-body" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="var(--accent2)" />
              <stop offset="1" stopColor="var(--accent)" />
            </linearGradient>
          </defs>
          {/* cushion */}
          <rect x="3" y="3" width="24" height="14" rx="7" fill="url(#hb-body)" />
          <rect x="6" y="5" width="14" height="3" rx="1.5" fill="rgb(255 255 255 / .5)" />
          {/* bristles, squash on press */}
          <motion.g animate={{ scaleY: press ? 0.7 : 1 }} style={{ transformOrigin: `${TIP_X}px ${TIP_Y}px` }} transition={{ type: "spring", stiffness: 600, damping: 20 }}>
            {Array.from({ length: 7 }, (_, i) => {
              const bx = 6.5 + i * 2.9;
              return <line key={i} x1={bx} y1={17} x2={bx} y2={TIP_Y} stroke="var(--cream)" strokeWidth="1.4" strokeLinecap="round" />;
            })}
          </motion.g>
        </svg>
      </motion.div>
    </motion.div>
  );
}
