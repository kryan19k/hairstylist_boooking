import type { Metadata } from "next";
import Header from "@/components/Header";
import Dock from "@/components/Dock";
import WorkPanel from "@/components/panels/WorkPanel";
import { PortfolioHeading, PortfolioCta, BackHome } from "@/components/PortfolioIntro";
import { getContent } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 30;

export async function generateMetadata(): Promise<Metadata> {
  const { settings: s } = await getContent();
  return pageMetadata(s, { title: "Portfolio", path: "/portfolio", description: `Recent hair color, balayage, cuts and bridal styling by ${s.stylist} at ${s.name} ${s.tagline}, ${s.city}.` });
}

export default async function PortfolioPage() {
  const { settings: s } = await getContent();
  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 pt-32 pb-12 sm:px-8">
        <PortfolioHeading />
        <WorkPanel />
        <div className="mt-16 text-center">
          <PortfolioCta />
        </div>
      </main>
      <footer className="border-t border-line px-4 pt-10 pb-32 text-center text-xs text-muted sm:px-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt={`${s.name} ${s.tagline}`} width={120} className="logo-img mx-auto mb-3 h-28 w-auto" />
        <p className="mt-2">{s.address}{s.phone ? ` · ${s.phone}` : ""}</p>
        <BackHome />
      </footer>
      <Dock />
    </>
  );
}
