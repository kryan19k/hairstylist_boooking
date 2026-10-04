"use client";
import { useSyncExternalStore } from "react";

import { shades, type ShadeId } from "./shades";
export { shades };
export type { ShadeId };
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

const shadeStore = makeStore<ShadeId>(SHADE_KEY, "shade", (v) => shades.some((s) => s.id === v), "honey");
const themeStore = makeStore<Theme>(THEME_KEY, "theme", (v) => v === "light" || v === "dark", "light");

export const setShade = shadeStore.set;
export const setTheme = themeStore.set;
export const useShade = () => useSyncExternalStore(shadeStore.subscribe, shadeStore.get, () => "honey" as ShadeId);
export const useTheme = () => useSyncExternalStore(themeStore.subscribe, themeStore.get, () => "light" as Theme);

// Runs in <head> before paint so a returning visitor never flashes the wrong shade/theme.
export const bootScript = `try{var d=document.documentElement,s=localStorage.getItem("${SHADE_KEY}"),t=localStorage.getItem("${THEME_KEY}");if(s)d.dataset.shade=s;if(t)d.dataset.theme=t}catch(e){}`;
