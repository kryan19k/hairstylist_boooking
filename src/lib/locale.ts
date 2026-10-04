"use client";
import { useCallback, useMemo, useSyncExternalStore } from "react";
import { dict, type Locale } from "./i18n";
import { formatDuration } from "./availability";
import { adminEs } from "./admin-es";

const KEY = "ella-lang";
const listeners = new Set<() => void>();
let current: Locale | null = null;

function read(): Locale {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "en" || v === "es") return v;
  } catch {}
  // First visit: follow the browser's language.
  return typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("es") ? "es" : "en";
}

export function setLocale(l: Locale) {
  current = l;
  document.documentElement.lang = l;
  try {
    localStorage.setItem(KEY, l);
  } catch {}
  listeners.forEach((fn) => fn());
}

const get = () => (current ??= read());
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export const useLocale = () => useSyncExternalStore(subscribe, get, () => "en" as Locale);

/** Sets <html lang> once the real locale is known (kept out of render). */
export const syncHtmlLang = () => {
  if (typeof document !== "undefined") document.documentElement.lang = get();
};

export type TFn = (key: string, vars?: Record<string, string | number>) => string;

export function makeT(locale: Locale): TFn {
  return (key, vars) => {
    let s = dict[locale][key] ?? dict.en[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
    return s;
  };
}

export function useT(): TFn {
  const locale = useLocale();
  return useMemo(() => makeT(locale), [locale]);
}

/** Dashboard text: pass the English string, get it back in the current language. */
export type TxFn = (text: string, vars?: Record<string, string | number>) => string;
export function useTx(): TxFn {
  const locale = useLocale();
  return useMemo(
    () => (text, vars) => {
      let s = locale === "es" ? (adminEs[text] ?? text) : text;
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
      return s;
    },
    [locale],
  );
}

/** Duration formatter in the current language ("2 hrs 30 min" / "2 h 30 min"). */
export function useDuration() {
  const locale = useLocale();
  return useCallback((m: number) => formatDuration(m, locale === "es"), [locale]);
}

/** BCP-47 tag for Intl/date formatting. */
export const intlTag = (l: Locale) => (l === "es" ? "es-US" : "en-US");
