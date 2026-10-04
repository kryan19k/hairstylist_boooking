"use client";
import { useSyncExternalStore } from "react";

// Each shade = accent + analogous partner + complementary "counter" (color-theory trio).
// Swatches show the dark-mode values; globals.css re-tunes each for light mode.
export const shades = [
  { id: "gold", name: "Desert Gold", accent: "#d4a94a", accent2: "#f0d58c", counter: "#7fa38c" },
  { id: "sage", name: "Sage", accent: "#9bb89a", accent2: "#d3e4cd", counter: "#d98a73" },
  { id: "coral", name: "Coral", accent: "#f0806a", accent2: "#f7b8a0", counter: "#7fb8a6" },
  { id: "copper", name: "Copper", accent: "#e58a4e", accent2: "#f4c08a", counter: "#4fb3a6" },
  { id: "rose", name: "Rose Gold", accent: "#ec9aa0", accent2: "#f8cdbf", counter: "#8fbf9f" },
  { id: "orchid", name: "Orchid", accent: "#b78be8", accent2: "#e6c9f7", counter: "#d9c46a" },
  { id: "platinum", name: "Platinum", accent: "#cdd7e8", accent2: "#f2f5fb", counter: "#e0a96d" },
  { id: "emerald", name: "Emerald", accent: "#55c79c", accent2: "#b9efd8", counter: "#e88a9a" },
] as const;
export type ShadeId = (typeof shades)[number]["id"];
export type Theme = "light" | "dark";

const SHADE_KEY = "ella-shade";
const THEME_KEY = "ella-theme";

function makeStore<T extends string>(key: string, attr: "shade" | "theme", valid: (v: string) => boolean, fallback: T) {
  const listeners = new Set<() => void>();
  let current: T | null = null;
  const read = (): T => {
    try {
      const v = localStorage.getItem(key);
      if (v && valid(v)) return v as T;
    } catch {}
    // Otherwise whatever the server stamped on <html> (the owner's chosen default).
    const d = document.documentElement.dataset[attr];
    return (d && valid(d) ? d : fallback) as T;
  };
  return {
    get: () => (current ??= read()),
    set(v: T) {
      current = v;
      document.documentElement.dataset[attr] = v;
      try {
        localStorage.setItem(key, v);
      } catch {}
      listeners.forEach((l) => l());
    },
    subscribe(cb: () => void) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    fallback,
  };
}

const shadeStore = makeStore<ShadeId>(SHADE_KEY, "shade", (v) => shades.some((s) => s.id === v), "gold");
const themeStore = makeStore<Theme>(THEME_KEY, "theme", (v) => v === "light" || v === "dark", "light");

export const setShade = shadeStore.set;
export const setTheme = themeStore.set;
export const useShade = () => useSyncExternalStore(shadeStore.subscribe, shadeStore.get, () => "gold" as ShadeId);
export const useTheme = () => useSyncExternalStore(themeStore.subscribe, themeStore.get, () => "light" as Theme);

// Runs in <head> before paint so a returning visitor never flashes the wrong shade/theme.
export const bootScript = `try{var d=document.documentElement,s=localStorage.getItem("${SHADE_KEY}"),t=localStorage.getItem("${THEME_KEY}");if(s)d.dataset.shade=s;if(t)d.dataset.theme=t}catch(e){}`;
