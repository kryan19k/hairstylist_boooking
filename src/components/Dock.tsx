"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { goTab, tabs, useTab } from "@/lib/tabs";
import { useT } from "@/lib/locale";
import { useContent } from "./ContentProvider";

const navKey = { services: "nav.menu", book: "nav.reserve", stories: "nav.stories", studio: "nav.studio" } as const;

// Floating pill nav — the page's tab bar. Always within thumb reach.
export default function Dock() {
  const active = useTab();
  const path = usePathname();
  const onPortfolio = path === "/portfolio";
  const onProducts = path === "/products";
  const { products } = useContent();
  const tr = useT();
  return (
    <motion.nav
      aria-label={tr("nav.sections")}
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 1.2, type: "spring", stiffness: 160, damping: 20 }}
      className="fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 flex justify-center px-2"
    >
      <div role="tablist" className="glass flex items-center gap-0.5 rounded-full p-1.5 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.7)]">
        {tabs.map((t) => {
          const on = !onPortfolio && !onProducts && active === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={on}
              aria-controls="studio-panel"
              onClick={() => goTab(t.id)}
              className={`relative rounded-full px-3 py-2.5 text-[0.8rem] font-medium transition-colors sm:px-6 sm:text-sm ${on ? "text-on-accent" : "text-cream/70 hover:text-cream"}`}
            >
              {on && (
                <motion.span
                  layoutId="dock-pill"
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-accent2 to-accent"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative">{tr(navKey[t.id])}</span>
            </button>
          );
        })}
        {products.length > 0 && (
          <Link
            href="/products"
            aria-current={onProducts ? "page" : undefined}
            className={`rounded-full px-2.5 py-2.5 text-[0.8rem] font-medium transition-colors sm:px-6 sm:text-sm ${onProducts ? "bg-gradient-to-br from-accent2 to-accent text-on-accent" : "text-cream/70 hover:text-cream"}`}
          >
            {tr("nav.products")}
          </Link>
        )}
        <Link
          href="/portfolio"
          aria-current={onPortfolio ? "page" : undefined}
          className={`rounded-full px-3 py-2.5 text-[0.8rem] font-medium transition-colors sm:px-6 sm:text-sm ${onPortfolio ? "bg-gradient-to-br from-accent2 to-accent text-on-accent" : "text-cream/70 hover:text-cream"}`}
        >
          {tr("nav.portfolio")}
        </Link>
      </div>
    </motion.nav>
  );
}
