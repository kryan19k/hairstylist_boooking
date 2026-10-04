"use client";
import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useTab, tabs, goTab, type TabId } from "@/lib/tabs";
import { useT } from "@/lib/locale";
import ServicesPanel from "./panels/ServicesPanel";
import BookPanel from "./panels/BookPanel";
import StoriesPanel from "./panels/StoriesPanel";
import StudioPanel from "./panels/StudioPanel";

export default function Studio() {
  const tab = useTab();
  const t = useT();
  // Arriving from another page via /#book etc.: scroll the panel into view once.
  useEffect(() => {
    const h = window.location.hash.replace("#", "") as TabId;
    if (tabs.some((x) => x.id === h)) setTimeout(() => goTab(h), 150);
  }, []);
  const key = { services: "menu", book: "book", stories: "stories", studio: "studio" }[tab];
  return (
    <section id="studio-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="relative mx-auto max-w-7xl scroll-mt-24 px-4 pt-16 pb-40 sm:px-8">
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -20, filter: "blur(6px)" }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="mb-10 flex items-end justify-between gap-6 border-b border-line pb-6">
            <div>
              <p className="text-xs tracking-[0.3em] text-accent uppercase">
                {String(tabs.findIndex((x) => x.id === tab) + 1).padStart(2, "0")} — {t(`studio.${key}.k`)}
              </p>
              <h2 className="font-display mt-3 text-4xl font-light sm:text-6xl">{t(`studio.${key}.t`)}</h2>
            </div>
          </div>
          {tab === "services" && <ServicesPanel />}
          {tab === "book" && <BookPanel />}
          {tab === "stories" && <StoriesPanel />}
          {tab === "studio" && <StudioPanel />}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
