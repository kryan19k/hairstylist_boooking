"use client";
import { useEffect, useRef } from "react";
import { useShade } from "@/lib/shade";

type Strand = { y: number; amp: number; freq: number; speed: number; phase: number; mix: number; w: number; a: number };

// Hundreds of silk-thin strands that flow like hair in wind, part around the cursor,
// and take their colour from the visitor's chosen shade.
export default function StrandField({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const shade = useShade();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const css = getComputedStyle(document.documentElement);
    const hex = (v: string) => {
      const n = parseInt(css.getPropertyValue(v).trim().slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    };
    const c1 = hex("--accent2"), c2 = hex("--accent"), c3 = hex("--counter");
    const lerp = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
    const colorAt = (t: number) => (t < 0.7 ? lerp(c1, c2, t / 0.7) : lerp(c2, c3, (t - 0.7) / 0.3));

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, dpr = 1, raf = 0, visible = true;
    const mouse = { x: -999, y: -999, tx: -999, ty: -999 };
    const COUNT = window.innerWidth < 700 ? 70 : 130;
    const strands: Strand[] = Array.from({ length: COUNT }, (_, i) => {
      const t = i / (COUNT - 1);
      return {
        y: t,
        amp: 40 + Math.random() * 90,
        freq: 0.0016 + Math.random() * 0.0016,
        speed: 0.25 + Math.random() * 0.45,
        phase: Math.random() * Math.PI * 2,
        mix: Math.min(1, Math.max(0, t * 0.8 + Math.random() * 0.25)),
        w: 0.5 + Math.random() * 1.1,
        a: 0.22 + Math.random() * 0.5,
      };
    });

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (time: number) => {
      const t = time / 1000;
      mouse.x += (mouse.tx - mouse.x) * 0.08;
      mouse.y += (mouse.ty - mouse.y) * 0.08;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      const step = 18;
      for (const s of strands) {
        const [r, g, b] = colorAt(s.mix);
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${r},${g},${b},${s.a})`;
        ctx.lineWidth = s.w;
        // Strands fan from a pinched root on the left to a wide flowing fall on the right.
        const baseSpread = h * 0.78;
        for (let x = -20; x <= w + 20; x += step) {
          const p = (x + 20) / (w + 40);
          const fan = 0.15 + p * 0.85;
          let y = h * 0.5 + (s.y - 0.5) * baseSpread * fan
            + Math.sin(x * s.freq + t * s.speed + s.phase) * s.amp * p
            + Math.sin(x * 0.0007 - t * 0.2 + s.phase * 2) * 60 * p;
          // Cursor parts the strands like a comb moving through hair.
          const dx = x - mouse.x, dy = y - mouse.y;
          const d2 = dx * dx + dy * dy;
          const R = 190;
          if (d2 < R * R * 4) {
            const f = Math.exp(-d2 / (R * R));
            y += (dy >= 0 ? 1 : -1) * f * 70;
          }
          if (x === -20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";
      if (!reduce && visible) raf = requestAnimationFrame(draw);
    };

    resize();
    if (reduce) draw(2000);
    else raf = requestAnimationFrame(draw);

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.tx = e.clientX - r.left; mouse.ty = e.clientY - r.top;
      if (mouse.x < -900) { mouse.x = mouse.tx; mouse.y = mouse.ty; }
    };
    const onLeave = () => { mouse.tx = -999; mouse.ty = -999; };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !reduce) { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); }
    });
    io.observe(canvas);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove);
    document.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [shade]);

  return <canvas ref={ref} aria-hidden className={`absolute inset-0 h-full w-full ${className}`} />;
}
