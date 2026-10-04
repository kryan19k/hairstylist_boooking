"use client";
import Link from "next/link";
import { motion } from "motion/react";
import { goTab, tabs, useTab } from "@/lib/tabs";

// Floating pill nav — the page's tab bar. Always within thumb reach.
export default function Dock() {
  const active = useTab();
  return (
    <motion.nav
      aria-label="Sections"
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 1.2, type: "spring", stiffness: 160, damping: 20 }}
      className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-3"
    >
      <div role="tablist" className="glass flex items-center gap-0.5 rounded-full p-1.5 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.7)]">
        {tabs.map((t) => {
          const on = active === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={on}
              aria-controls="studio-panel"
              onClick={() => goTab(t.id)}
              className={`relative rounded-full px-4 py-2.5 text-sm font-medium transition-colors sm:px-6 ${on ? "text-on-accent" : "text-cream/70 hover:text-cream"}`}
            >
              {on && (
                <motion.span
                  layoutId="dock-pill"
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-accent2 to-accent"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative">{t.label}</span>
            </button>
          );
        })}
        <Link href="/portfolio" className="rounded-full px-4 py-2.5 text-sm font-medium text-cream/70 transition-colors hover:text-cream sm:px-6">Portfolio</Link>
      </div>
    </motion.nav>
  );
}
