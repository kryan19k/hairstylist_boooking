"use client";
import { createContext, useContext } from "react";
import type { Content } from "@/lib/content";

const Ctx = createContext<Content | null>(null);

export function ContentProvider({ content, children }: { content: Content; children: React.ReactNode }) {
  return <Ctx.Provider value={content}>{children}</Ctx.Provider>;
}

export function useContent() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useContent must be used inside <ContentProvider>");
  return c;
}
