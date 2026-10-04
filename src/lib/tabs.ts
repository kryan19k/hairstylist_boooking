"use client";
import { useSyncExternalStore } from "react";

export const tabs = [
  { id: "services", label: "Menu" },
  { id: "book", label: "Book" },
  { id: "stories", label: "Stories" },
  { id: "studio", label: "Studio" },
] as const;
export type TabId = (typeof tabs)[number]["id"];

const isTab = (v: string): v is TabId => tabs.some((t) => t.id === v);
const read = (): TabId => {
  const h = window.location.hash.replace("#", "");
  return isTab(h) ? h : "services";
};
const subscribe = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};

export const useTab = () => useSyncExternalStore(subscribe, read, () => "services" as TabId);

export function goTab(id: TabId, { scroll = true } = {}) {
  // On other pages (e.g. /portfolio) there is no tab panel, so head home to it.
  if (!document.getElementById("studio-panel")) {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- plain navigation from a non-home page
    window.location.href = `/#${id}`;
    return;
  }
  window.history.replaceState(null, "", `#${id}`);
  window.dispatchEvent(new Event("hashchange"));
  if (scroll) {
    const el = document.getElementById("studio-panel");
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 84;
      window.scrollTo({ top, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }
  }
}
