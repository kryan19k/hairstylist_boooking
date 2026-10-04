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
        <TeamSection />
        <StylistSection />
        <Studio />
      </main>
      <footer className="border-t border-line px-4 pt-10 pb-32 text-center text-xs text-muted sm:px-8">
        <p className="font-display text-2xl text-cream">{s.name} <span className="text-base text-muted">{s.tagline}</span></p>
        <p className="mt-2">{s.address}{s.phone ? ` · ${s.phone}` : ""}</p>
        <p className="mt-1">© {new Date().getFullYear()} {s.name} {s.tagline}</p>
      </footer>
      <Dock />
    </>
  );
}
