import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Dock from "@/components/Dock";
import ProductsPanel from "@/components/ProductsPanel";
import { ProductsHeading, ProductsCta } from "@/components/ProductsIntro";
import { getContent } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 30;

export async function generateMetadata(): Promise<Metadata> {
  const { settings: s } = await getContent();
  return pageMetadata(s, { title: "Products", path: "/products", description: `Salon products from ${s.name} ${s.tagline} in ${s.city}: eyelash extensions, shampoo, conditioner and treatments.` });
}

export default async function ProductsPage() {
  const { settings: s } = await getContent();
  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 pt-32 pb-12 sm:px-8">
        <ProductsHeading />
        <ProductsPanel />
        <div className="mt-16 text-center"><ProductsCta /></div>
      </main>
      <footer className="border-t border-line px-4 pt-10 pb-32 text-center text-xs text-muted sm:px-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt={`${s.name} ${s.tagline}`} width={120} className="logo-img mx-auto mb-3 h-28 w-auto" />
        <p className="mt-2">{s.address}{s.phone ? ` · ${s.phone}` : ""}</p>
        <Link href="/" className="mt-3 inline-block text-accent2 hover:underline">← {s.name}</Link>
      </footer>
      <Dock />
    </>
  );
}
