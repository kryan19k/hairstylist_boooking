"use client";
import { motion, useScroll, useTransform } from "motion/react";
import { goTab } from "@/lib/tabs";
import { site } from "@/lib/site";
import { useClientValue } from "@/lib/client-value";
import { dateKey, formatTime, nextAvailable, parseDateKey } from "@/lib/availability";
import ShadeSwitcher from "./ShadeSwitcher";

function nextLabel() {
  const now = new Date();
  const n = nextAvailable(now);
  if (!n) return "";
  const d = parseDateKey(n.key);
  const day = n.key === dateKey(now) ? "Today" : d.toLocaleDateString("en-US", { weekday: "short" });
  return `${day} ${formatTime(n.time)}`;
}

export default function Header() {
  const next = useClientValue(nextLabel, "");
  const { scrollY } = useScroll();
  const bg = useTransform(scrollY, [0, 200], [0, 1]);
  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <motion.div aria-hidden style={{ opacity: bg }} className="glass absolute inset-0 border-x-0 border-t-0" />
      <div className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-8">
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          className="flex items-baseline gap-2"
        >
          <span className="font-display text-2xl font-medium tracking-tight">{site.name}</span>
          <span className="hidden text-[0.65rem] tracking-[0.3em] text-muted uppercase sm:inline">{site.tagline}</span>
        </a>
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="hidden md:block"><ShadeSwitcher /></div>
          {next && (
            <motion.button
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              onClick={() => goTab("book")}
              className="glass hidden items-center gap-2 rounded-full py-1.5 pr-4 pl-3 text-xs sm:flex"
            >
              <span className="pulse-dot size-2 rounded-full bg-counter" />
              <span className="text-muted">Next opening</span>
              <span className="font-semibold">{next}</span>
            </motion.button>
          )}
          <button onClick={() => goTab("book")} className="btn-accent rounded-full px-5 py-2 text-sm">Book now</button>
        </div>
      </div>
    </header>
  );
}
