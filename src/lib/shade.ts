"use client";
import { useSyncExternalStore } from "react";

// Each shade = accent + analogous partner + complementary "counter" (color-theory trio).
export const shades = [
  { id: "copper", name: "Copper", accent: "#e58a4e", accent2: "#f4c08a", counter: "#4fb3a6" },
  { id: "rose", name: "Rose Gold", accent: "#ec9aa0", accent2: "#f8cdbf", counter: "#8fbf9f" },
  { id: "orchid", name: "Orchid", accent: "#b78be8", accent2: "#e6c9f7", counter: "#d9c46a" },
  { id: "platinum", name: "Platinum", accent: "#cdd7e8", accent2: "#f2f5fb", counter: "#e0a96d" },
  { id: "emerald", name: "Emerald", accent: "#55c79c", accent2: "#b9efd8", counter: "#e88a9a" },
] as const;
export type ShadeId = (typeof shades)[number]["id"];

const KEY = "aurelle-shade";
const listeners = new Set<() => void>();

function read(): ShadeId {
  try {
    const v = localStorage.getItem(KEY) as ShadeId | null;
    if (v && shades.some((s) => s.id === v)) return v;
  } catch {}
  return "copper";
}

let current: ShadeId | null = null;
const get = () => (current ??= read());

export function setShade(id: ShadeId) {
  current = id;
  document.documentElement.dataset.shade = id;
  try {
    localStorage.setItem(KEY, id);
  } catch {}
  listeners.forEach((l) => l());
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export const useShade = () => useSyncExternalStore(subscribe, get, () => "copper" as ShadeId);

// Runs in <head> before paint so a returning visitor never sees a flash of the default shade.
export const shadeBootScript = `try{var s=localStorage.getItem("${KEY}");if(s)document.documentElement.dataset.shade=s}catch(e){}`;
