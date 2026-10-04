import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Studio from "@/components/Studio";
import TeamSection from "@/components/TeamSection";
import StylistSection from "@/components/StylistSection";
import Dock from "@/components/Dock";
import { getContent } from "@/lib/content";
import JsonLd from "@/components/JsonLd";
import { faqJsonLd, localBusinessJsonLd } from "@/lib/seo";

export const revalidate = 30;

export default async function Home() {
  const content = await getContent();
  const s = content.settings;
  return (
    <>
      <JsonLd data={[localBusinessJsonLd(content), faqJsonLd(content)]} />
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
        <address className="mt-2 not-italic">
          {s.address}{s.address && s.phone ? " · " : ""}
          {s.phone && <a href={`tel:${s.phone}`} className="hover:underline">{s.phone}</a>}
          {(s.address || s.phone) && s.email ? " · " : ""}
          {s.email && <a href={`mailto:${s.email}`} className="hover:underline">{s.email}</a>}
        </address>
        <p className="mt-1">© {new Date().getFullYear()} {s.name} {s.tagline}</p>
      </footer>
      <Dock />
    </>
  );
}
