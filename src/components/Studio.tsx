"use client";
import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useTab, tabs, goTab, type TabId } from "@/lib/tabs";
import ServicesPanel from "./panels/ServicesPanel";
import BookPanel from "./panels/BookPanel";
import StoriesPanel from "./panels/StoriesPanel";
import StudioPanel from "./panels/StudioPanel";

const titles = {
  services: ["The Menu", "Priced plainly. Timed honestly."],
  book: ["Reserve", "Choose your service, then your moment."],
  stories: ["Stories", "In their words."],
  studio: ["The Studio", "Come in. Stay a while."],
} as const;

export default function Studio() {
  const tab = useTab();
  // Arriving from another page via /#book etc.: scroll the panel into view once.
  useEffect(() => {
    const h = window.location.hash.replace("#", "") as TabId;
    if (tabs.some((t) => t.id === h)) setTimeout(() => goTab(h), 150);
  }, []);
  const [kicker, title] = titles[tab];
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
                {String(tabs.findIndex((t) => t.id === tab) + 1).padStart(2, "0")} — {kicker}
              </p>
              <h2 className="font-display mt-3 text-4xl font-light sm:text-6xl">{title}</h2>
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
