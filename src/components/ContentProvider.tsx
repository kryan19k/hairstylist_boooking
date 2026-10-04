"use client";
import { createContext, useContext, useEffect, useMemo } from "react";
import type { Content } from "@/lib/content";
import { localizeContent } from "@/lib/localize";
import { useLocale } from "@/lib/locale";

const Ctx = createContext<Content | null>(null);

export function ContentProvider({ content, children }: { content: Content; children: React.ReactNode }) {
  const locale = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return <Ctx.Provider value={content}>{children}</Ctx.Provider>;
}

/** Content in the visitor's language (Spanish fields override English where the owner provided them). */
export function useContent() {
  const c = useContext(Ctx);
  const locale = useLocale();
  const out = useMemo(() => (c ? localizeContent(c, locale) : null), [c, locale]);
  if (!out) throw new Error("useContent must be used inside <ContentProvider>");
  return out;
}
