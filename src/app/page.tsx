import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Studio from "@/components/Studio";
import Dock from "@/components/Dock";
import { site } from "@/lib/site";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Studio />
      </main>
      <footer className="border-t border-line px-4 pt-10 pb-32 text-center text-xs text-muted sm:px-8">
        <p className="font-display text-2xl text-cream">{site.name}</p>
        <p className="mt-2">{site.address} · {site.city} · {site.phone}</p>
        <p className="mt-1">© {new Date().getFullYear()} {site.name} {site.tagline}. Placeholder content.</p>
      </footer>
      <Dock />
    </>
  );
}
