"use client";
import Link from "next/link";
import { useContent } from "./ContentProvider";
import { useT } from "@/lib/locale";

export function ProductsHeading() {
  const { settings: s } = useContent();
  const t = useT();
  return (
    <div className="mb-10 flex flex-col gap-3 border-b border-line pb-8">
      <p className="text-xs tracking-[0.3em] text-accent uppercase">{t("products.kicker")}</p>
      <h1 className="font-display text-5xl font-light sm:text-7xl">{t("products.title1")} <span className="text-shade italic">{t("products.title2")}</span></h1>
      <p className="max-w-xl text-cream/70">{t("products.blurb", { name: s.name })}</p>
    </div>
  );
}

export function ProductsCta() {
  const t = useT();
  return <Link href="/#book" className="btn-accent inline-block rounded-full px-9 py-4">{t("products.book")}</Link>;
}
