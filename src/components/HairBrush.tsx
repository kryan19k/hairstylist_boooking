"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, useMotionValue, useSpring } from "motion/react";

const INTERACTIVE = "a, button, [role='tab'], [role='radio'], [role='option'], summary, label, input[type='range'], input[type='checkbox']";
const TEXTY = "input:not([type='range']):not([type='checkbox']), textarea, select";
const BASE_TILT = 34; // handle trails up-right, bristles lead down-left, like a brush mid-stroke

// A paddle hairbrush that IS the cursor. Its bristle tip sits exactly on the pointer,
// it leans into the direction you move, and the bristles squash on press.
export default function HairBrush() {
  const path = usePathname();
  const off = path.startsWith("/admin");
  const [on, setOn] = useState(false);
  const [state, setState] = useState<"idle" | "hover" | "press" | "text">("idle");

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 900, damping: 46, mass: 0.35 });
  const sy = useSpring(y, { stiffness: 900, damping: 46, mass: 0.35 });
  const tilt = useMotionValue(BASE_TILT);
  const rot = useSpring(tilt, { stiffness: 160, damping: 14 });

  useEffect(() => {
    if (off) return;
    if (!window.matchMedia("(pointer: fine) and (hover: hover)").matches) return;
    const root = document.documentElement;
    root.classList.add("has-brush");
    let idle: ReturnType<typeof setTimeout>;

    const move = (e: PointerEvent) => {
      setOn(true);
      x.set(e.clientX);
      y.set(e.clientY);
      tilt.set(BASE_TILT - Math.max(-30, Math.min(30, e.movementX * 1.6)));
      clearTimeout(idle);
      idle = setTimeout(() => tilt.set(BASE_TILT), 90);
      const t = e.target as Element | null;
      setState(t?.closest(TEXTY) ? "text" : t?.closest(INTERACTIVE) ? "hover" : "idle");
    };
    const down = () => setState((s) => (s === "text" ? s : "press"));
    const up = (e: PointerEvent) => {
      const t = e.target as Element | null;
      setState(t?.closest(TEXTY) ? "text" : t?.closest(INTERACTIVE) ? "hover" : "idle");
    };
    const leave = () => setOn(false);
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
  }, [off, x, y, tilt]);

  if (off) return null;
  const hidden = !on || state === "text";
  const scale = state === "press" ? 0.94 : state === "hover" ? 1.18 : 1;
  const squash = state === "press" ? 0.72 : state === "hover" ? 1.08 : 1;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[100]"
      style={{ x: sx, y: sy, opacity: hidden ? 0 : 1, transition: "opacity .15s" }}
    >
      {/* origin = bristle tip, so rotation pivots around the pointer */}
      <motion.div
        style={{ rotate: rot, transformOrigin: "24px 92px", left: -24, top: -92, position: "absolute" }}
        animate={{ scale }}
        transition={{ type: "spring", stiffness: 500, damping: 22 }}
      >
        <svg width="48" height="96" viewBox="0 0 48 96" style={{ overflow: "visible", filter: "drop-shadow(0 6px 7px rgb(0 0 0 / .35))" }}>
          <defs>
            <linearGradient id="hb-handle" x1="0" x2="1">
              <stop offset="0" stopColor="var(--accent2)" />
              <stop offset="1" stopColor="var(--accent)" />
            </linearGradient>
          </defs>
          {/* handle */}
          <path d="M20 54 L18 12 Q18 3 24 3 Q30 3 30 12 L28 54 Z" fill="url(#hb-handle)" />
          <path d="M22 50 L21 14" stroke="rgb(255 255 255 / .45)" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="24" cy="10" r="1.8" fill="rgb(0 0 0 / .25)" />
          {/* cushion */}
          <rect x="9" y="52" width="30" height="26" rx="11" fill="var(--ink-3)" stroke="var(--accent)" strokeWidth="1.4" />
          <rect x="9" y="52" width="30" height="8" rx="4" fill="rgb(255 255 255 / .12)" />
          {/* bristles — squash on press, splay on hover */}
          <motion.g animate={{ scaleY: squash }} style={{ transformOrigin: "24px 92px" }} transition={{ type: "spring", stiffness: 600, damping: 20 }}>
            {Array.from({ length: 7 }, (_, i) => {
              const bx = 13 + i * 3.7;
              return (
                <g key={i}>
                  <line x1={bx} y1={78} x2={bx + (i - 3) * 0.5} y2={92} stroke="var(--cream)" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx={bx + (i - 3) * 0.5} cy={92} r="1.5" fill="var(--accent2)" />
                </g>
              );
            })}
          </motion.g>
        </svg>
      </motion.div>
    </motion.div>
  );
}
