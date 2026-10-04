"use client";
import Link from "next/link";
import { useContent } from "./ContentProvider";
import { useT } from "@/lib/locale";

export function PortfolioHeading() {
  const { settings: s } = useContent();
  const t = useT();
  return (
    <div className="mb-10 flex flex-col gap-3 border-b border-line pb-8">
      <p className="text-xs tracking-[0.3em] text-accent uppercase">{t("work.kicker")}</p>
      <h1 className="font-display text-5xl font-light sm:text-7xl">{t("work.title1")} <span className="text-shade italic">{t("work.title2")}</span></h1>
      <p className="max-w-xl text-cream/70">{t("work.blurb", { name: s.name, tagline: s.tagline })}</p>
    </div>
  );
}

export function PortfolioCta() {
  const t = useT();
  return <Link href="/#book" className="btn-accent inline-block rounded-full px-9 py-4">{t("work.bookCta")}</Link>;
}

export function BackHome() {
  const t = useT();
  return <Link href="/" className="mt-3 inline-block text-accent2 hover:underline">{t("work.home")}</Link>;
}
