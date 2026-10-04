import type { Look } from "@/lib/data";

// Deterministic PRNG so server + client render identical strands.
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const W = 300, H = 400;

function strandPath(r: () => number, kind: Look["kind"]) {
  const x0 = 70 + r() * 160;
  const freq = kind === "curl" ? 0.09 + r() * 0.04 : kind === "wave" ? 0.03 + r() * 0.015 : 0.012 + r() * 0.01;
  const amp = kind === "curl" ? 9 + r() * 7 : kind === "wave" ? 12 + r() * 10 : 5 + r() * 7;
  const len = kind === "bob" ? 250 + r() * 14 : 330 + r() * 60;
  const phase = r() * 6.28;
  const drift = (r() - 0.5) * 70;
  const pts: string[] = [];
  for (let y = -10; y <= len; y += 8) {
    const t = y / H;
    const part = (x0 - 150) * (0.55 + t * 0.7);
    const x = 150 + part + Math.sin(y * freq + phase) * amp * (0.35 + t) + drift * t * t;
    pts.push(`${pts.length ? "L" : "M"}${x.toFixed(1)} ${y}`);
  }
  return pts.join(" ");
}

/** Procedural hair-fall illustration; stand-in until real photos are uploaded. */
export default function LookArt({ look, muted = false, className = "" }: { look: Look; muted?: boolean; className?: string }) {
  const r = rng(look.seed);
  const [dark, mid, light] = look.palette;
  const strands = Array.from({ length: 46 }, (_, i) => {
    const c = i % 7 === 0 ? light : i % 3 === 0 ? mid : i % 5 === 0 ? dark : mid;
    return { d: strandPath(r, look.kind), c, w: 0.8 + r() * 2.2, o: 0.35 + r() * 0.6 };
  });
  const id = `la-${look.id}${muted ? "-m" : ""}`;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className={className}
      style={muted ? { filter: "saturate(0.25) brightness(0.8) contrast(0.9)" } : undefined}
      role="img"
      aria-label={`${look.title} — illustrative preview`}
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor={dark} />
          <stop offset="0.6" stopColor={dark} stopOpacity="0.85" />
          <stop offset="1" stopColor={mid} stopOpacity="0.55" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="0.35" cy="0.25" r="0.7">
          <stop offset="0" stopColor={light} stopOpacity="0.45" />
          <stop offset="1" stopColor={light} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-fade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.5" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${id}-bg)`} />
      <rect width={W} height={H} fill={`url(#${id}-glow)`} />
      <g fill="none" strokeLinecap="round" style={{ mixBlendMode: "screen" }}>
        {strands.map((s, i) => (
          <path key={i} d={s.d} stroke={s.c} strokeWidth={s.w} opacity={s.o} />
        ))}
      </g>
      <rect width={W} height={H} fill={`url(#${id}-fade)`} />
    </svg>
  );
}
