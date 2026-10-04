import type { Metadata } from "next";
import Header from "@/components/Header";
import Dock from "@/components/Dock";
import WorkPanel from "@/components/panels/WorkPanel";
import { PortfolioHeading, PortfolioCta, BackHome } from "@/components/PortfolioIntro";
import { getContent } from "@/lib/content";

export const revalidate = 30;

export async function generateMetadata(): Promise<Metadata> {
  const { settings: s } = await getContent();
  return { title: `Portfolio — ${s.name} ${s.tagline}`, description: `Recent color, cuts and styling by ${s.stylist} at ${s.name} ${s.tagline}, ${s.city}.` };
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
        <p className="font-display text-2xl text-cream">{s.name} <span className="text-base text-muted">{s.tagline}</span></p>
        <p className="mt-2">{s.address}{s.phone ? ` · ${s.phone}` : ""}</p>
        <BackHome />
      </footer>
      <Dock />
    </>
  );
}
