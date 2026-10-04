import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import WorkPanel from "@/components/panels/WorkPanel";
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
      <main className="mx-auto max-w-7xl px-4 pt-32 pb-24 sm:px-8">
        <div className="mb-10 flex flex-col gap-3 border-b border-line pb-8">
          <p className="text-xs tracking-[0.3em] text-accent uppercase">Portfolio</p>
          <h1 className="font-display text-5xl font-light sm:text-7xl">Recent <span className="text-shade italic">work</span></h1>
          <p className="max-w-xl text-cream/70">Color, cuts and styling from the chair at {s.name} {s.tagline}. Tap any look to compare before and after, or book it.</p>
        </div>
        <WorkPanel />
        <div className="mt-16 text-center">
          <Link href="/#book" className="btn-accent inline-block rounded-full px-9 py-4">Book your look</Link>
        </div>
      </main>
      <footer className="border-t border-line px-4 pt-10 pb-12 text-center text-xs text-muted sm:px-8">
        <p className="font-display text-2xl text-cream">{s.name} <span className="text-base text-muted">{s.tagline}</span></p>
        <p className="mt-2">{s.address}{s.phone ? ` · ${s.phone}` : ""}</p>
        <Link href="/" className="mt-3 inline-block text-accent2 hover:underline">← Back to home</Link>
      </footer>
    </>
  );
}
