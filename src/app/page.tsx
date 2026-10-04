import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Studio from "@/components/Studio";
import TeamSection from "@/components/TeamSection";
import StylistSection from "@/components/StylistSection";
import Dock from "@/components/Dock";
import { getContent } from "@/lib/content";

export const revalidate = 30;

export default async function Home() {
  const { settings: s } = await getContent();
  return (
    <>
      <Header />
      <main>
        <Hero />
        <StylistSection />
        <TeamSection />
        <Studio />
      </main>
      <footer className="border-t border-line px-4 pt-10 pb-32 text-center text-xs text-muted sm:px-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt={`${s.name} ${s.tagline}`} width={120} className="logo-img mx-auto mb-3 h-28 w-auto" />
        <p className="mt-2">{s.address}{s.phone ? ` · ${s.phone}` : ""}</p>
        <p className="mt-1">© {new Date().getFullYear()} {s.name} {s.tagline}</p>
      </footer>
      <Dock />
    </>
  );
}
