"use client";
import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

const BASE_TILT = -28; // tips lean up-left like a pointer
const TIP_X = 24;
const TIP_Y = 3;
const PIVOT_Y = 50;
const IDLE_OPEN = 7;
const S = 0.95; // overall size

// Salon shears that ARE the cursor over the hero: polished blades, a screw, and finger/thumb rings
// that spread as the blades open. The blades open wider the faster you move and snip shut on click,
// which cuts the hair in the hero (see HairField). Everywhere else the normal pointer is used.
export default function Scissors() {
  const [shown, setShown] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 900, damping: 46, mass: 0.35 });
  const sy = useSpring(y, { stiffness: 900, damping: 46, mass: 0.35 });
  const tilt = useMotionValue(BASE_TILT);
  const rot = useSpring(tilt, { stiffness: 170, damping: 15 });
  const openTarget = useMotionValue(IDLE_OPEN);
  const open = useSpring(openTarget, { stiffness: 420, damping: 20 });
  const openNeg = useTransform(open, (v) => -v);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine) and (hover: hover)").matches) return;
    const root = document.documentElement;
    let idle: ReturnType<typeof setTimeout>;
    let pressed = false;

    const inHeroTarget = (t: Element | null) => !!t?.closest("#hero") && !t?.closest("a, button, [role='radio'], input");

    // after scrolling, the pointer may now be over something else: re-check what is under it
    let px = -1, py = -1;
    const onScroll = () => {
      if (px < 0) return;
      const inHero = inHeroTarget(document.elementFromPoint(px, py));
      root.classList.toggle("has-brush", inHero);
      setShown(inHero);
    };

    const move = (e: PointerEvent) => {
      px = e.clientX; py = e.clientY;
      const inHero = inHeroTarget(e.target as Element | null);
      root.classList.toggle("has-brush", inHero);
      setShown(inHero);
      if (!inHero) return;
      x.set(e.clientX);
      y.set(e.clientY);
      tilt.set(BASE_TILT - Math.max(-20, Math.min(20, e.movementX * 1.1)));
      if (!pressed) openTarget.set(IDLE_OPEN + Math.min(15, Math.hypot(e.movementX, e.movementY) * 0.7));
      clearTimeout(idle);
      idle = setTimeout(() => { tilt.set(BASE_TILT); if (!pressed) openTarget.set(IDLE_OPEN); }, 110);
    };
    const down = (e: PointerEvent) => {
      if (!inHeroTarget(e.target as Element | null)) return;
      pressed = true;
      openTarget.set(0); // snip! (the hair itself gets cut in HairField)
    };
    const up = () => {
      pressed = false;
      openTarget.set(IDLE_OPEN + 8);
      setTimeout(() => !pressed && openTarget.set(IDLE_OPEN), 120);
    };
    const leave = () => { root.classList.remove("has-brush"); setShown(false); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    document.documentElement.addEventListener("mouseleave", leave);
    return () => {
      clearTimeout(idle);
      root.classList.remove("has-brush");
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      document.documentElement.removeEventListener("mouseleave", leave);
    };
  }, [x, y, tilt, openTarget]);

  // Each half is drawn with its blade straight up from the pivot and its finger ring swung out to
  // its own side, then rotated about the screw. Opening the blades therefore spreads the rings too.
  const half = (angle: typeof open, side: -1 | 1) => {
    const ringX = 24 + side * 10;
    const ringY = side === -1 ? 86 : 83;
    const rx = side === -1 ? 8.4 : 6.6;
    const ry = side === -1 ? 10.5 : 8.6;
    return (
      <motion.g style={{ rotate: angle, originX: "24px", originY: `${PIVOT_Y}px` }}>
        {/* blade */}
        <path d={`M${24 - 3.4} ${PIVOT_Y} L24 ${TIP_Y} L${24 + 3.4} ${PIVOT_Y} Z`} fill="url(#sh-steel)" stroke="rgb(0 0 0 / .35)" strokeWidth="0.5" strokeLinejoin="round" />
        <path d={`M${24 - 0.4} ${PIVOT_Y - 3} L24 ${TIP_Y + 3}`} stroke="rgb(255 255 255 / .9)" strokeWidth="0.9" strokeLinecap="round" />
        {/* shank curving out to the ring */}
        <path d={`M24 ${PIVOT_Y} C24 ${PIVOT_Y + 11} ${ringX - side * 1} ${ringY - 18} ${ringX} ${ringY - ry + 1}`} fill="none" stroke="url(#sh-handle)" strokeWidth="3.4" strokeLinecap="round" />
        {/* ring */}
        <ellipse cx={ringX} cy={ringY} rx={rx} ry={ry} fill="none" stroke="url(#sh-handle)" strokeWidth="3.2" />
        {side === -1 && <path d={`M${ringX - rx + 1} ${ringY + ry - 2} q-3 5 -1 10`} fill="none" stroke="url(#sh-handle)" strokeWidth="2.6" strokeLinecap="round" />}
      </motion.g>
    );
  };

  return (
    <>
      <motion.div aria-hidden className="pointer-events-none fixed top-0 left-0 z-[100]" style={{ x: sx, y: sy, opacity: shown ? 1 : 0, transition: "opacity .12s" }}>
        <motion.div style={{ rotate: rot, transformOrigin: `${TIP_X * S}px ${TIP_Y * S}px`, left: -TIP_X * S, top: -TIP_Y * S, position: "absolute" }}>
          <svg width={48 * S} height={104 * S} viewBox="0 0 48 104" style={{ overflow: "visible", filter: "drop-shadow(0 3px 4px rgb(0 0 0 / .4))" }}>
            <defs>
              <linearGradient id="sh-steel" x1="0" x2="1">
                <stop offset="0" stopColor="#f9fafc" />
                <stop offset="0.55" stopColor="#c3c9d6" />
                <stop offset="1" stopColor="#8c93a3" />
              </linearGradient>
              <linearGradient id="sh-handle" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stopColor="var(--accent2)" />
                <stop offset="1" stopColor="var(--accent)" />
              </linearGradient>
            </defs>
            {half(open, -1)}
            {half(openNeg, 1)}
            {/* pivot screw */}
            <circle cx="24" cy={PIVOT_Y} r="3" fill="url(#sh-handle)" stroke="rgb(0 0 0 / .35)" strokeWidth="0.6" />
            <circle cx="23.2" cy={PIVOT_Y - 0.8} r="0.9" fill="rgb(255 255 255 / .85)" />
          </svg>
        </motion.div>
      </motion.div>
    </>
  );
}
