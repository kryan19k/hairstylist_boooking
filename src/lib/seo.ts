import type { Metadata } from "next";
import type { Content } from "./content";
import type { SiteSettings } from "./site";

/** The site's public origin. Set NEXT_PUBLIC_SITE_URL to your real domain once it is connected. */
export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || "localhost:3000";
  const full = /^https?:\/\//.test(raw) ? raw : `${raw.startsWith("localhost") ? "http" : "https"}://${raw}`;
  return full.replace(/\/$/, "");
}

const BUSINESS_TYPE = "HairSalon"; // schema.org type
const LOGO_PATH = "/logo.png"; // "" = none
const KEYWORDS = ["hair salon", "hair color", "balayage", "highlights", "precision haircut", "bridal hair", "hair stylist", "eyelash extensions", "book a hair appointment"];

export const defaultTitle = (s: SiteSettings) => `${s.name} ${s.tagline} | Hair Color, Cuts & Bridal in ${s.city}`;
export const defaultDescription = (s: SiteSettings) => `Book ${s.stylist} at ${s.name} ${s.tagline} in ${s.city} for custom hair color, balayage, precision cuts and bridal styling. See the portfolio and reserve your appointment online in minutes.`;

export function rootMetadata(s: SiteSettings): Metadata {
  const title = s.seoTitle.trim() || defaultTitle(s);
  const description = s.seoDescription.trim() || defaultDescription(s);
  const images = [s.ogImageUrl || "/opengraph-image"];
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: title, template: `%s | ${s.name}` },
    description,
    applicationName: s.name,
    keywords: KEYWORDS,
    authors: [{ name: s.stylist }],
    alternates: { canonical: "/" },
    openGraph: { type: "website", siteName: `${s.name} ${s.tagline}`, title, description, url: "/", locale: "en_US", alternateLocale: ["es_US"], images },
    twitter: { card: "summary_large_image", title, description, images },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
    verification: s.googleVerification.trim() ? { google: s.googleVerification.trim() } : undefined,
    formatDetection: { telephone: true },
  };
}

/** Metadata for the other public pages (portfolio, products…). */
export function pageMetadata(s: SiteSettings, o: { title: string; description: string; path: string }): Metadata {
  const images = [s.ogImageUrl || "/opengraph-image"];
  return {
    title: o.title,
    description: o.description,
    alternates: { canonical: o.path },
    openGraph: { type: "website", siteName: `${s.name} ${s.tagline}`, title: `${o.title} | ${s.name}`, description: o.description, url: o.path, locale: "en_US", alternateLocale: ["es_US"], images },
    twitter: { card: "summary_large_image", title: `${o.title} | ${s.name}`, description: o.description, images },
  };
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** "1451 S San Jacinto Ave, San Jacinto, CA 92583" → structured address (best effort). */
function parseAddress(address: string, city: string) {
  const a = address.trim();
  if (!a) return undefined;
  const m = a.match(/^(.*?),\s*([^,]+),\s*([A-Za-z]{2})\s*(\d{5})(?:-\d{4})?$/);
  if (m) return { "@type": "PostalAddress", streetAddress: m[1], addressLocality: m[2], addressRegion: m[3].toUpperCase(), postalCode: m[4], addressCountry: "US" };
  return { "@type": "PostalAddress", streetAddress: a, addressLocality: city, addressCountry: "US" };
}

export function localBusinessJsonLd(c: Content) {
  const s = c.settings;
  const url = siteUrl();
  // group weekdays that share the same hours
  const groups = new Map<string, { opens: string; closes: string; days: string[] }>();
  for (let d = 0; d < 7; d++) {
    const h = s.hours[d];
    if (!h) continue;
    const g = groups.get(h.join("-")) ?? { opens: h[0], closes: h[1], days: [] };
    g.days.push(DAYS[d]);
    groups.set(h.join("-"), g);
  }
  const prices = c.services.map((x) => x.price).filter((n) => n > 0);
  const image = s.ogImageUrl || `${url}/opengraph-image`;
  return {
    "@context": "https://schema.org",
    "@type": BUSINESS_TYPE,
    "@id": `${url}/#business`,
    name: `${s.name} ${s.tagline}`,
    url,
    description: s.seoDescription.trim() || defaultDescription(s),
    image,
    logo: LOGO_PATH ? `${url}${LOGO_PATH}` : image,
    telephone: s.phone || undefined,
    email: s.email || undefined,
    address: parseAddress(s.address, s.city),
    areaServed: s.city,
    priceRange: prices.length ? `$${Math.min(...prices)}–$${Math.max(...prices)}` : undefined,
    openingHoursSpecification: [...groups.values()].map((g) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: g.days, opens: g.opens, closes: g.closes })),
    sameAs: s.instagram ? [`https://www.instagram.com/${s.instagram}`] : undefined,
    founder: { "@type": "Person", name: s.stylist },
    employee: c.team.map((m) => ({ "@type": "Person", name: m.name, jobTitle: m.role || undefined })),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Services",
      itemListElement: c.services.map((x) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: x.name, description: x.blurb },
        priceSpecification: { "@type": "PriceSpecification", price: x.price, priceCurrency: "USD", minPrice: x.price },
      })),
    },
    potentialAction: { "@type": "ReserveAction", target: { "@type": "EntryPoint", urlTemplate: `${url}/#book`, actionPlatform: ["http://schema.org/DesktopWebPlatform", "http://schema.org/MobileWebPlatform"] }, result: { "@type": "Reservation", name: "Book an appointment" } },
  };
}

export function faqJsonLd(c: Content) {
  if (c.faqs.length === 0) return undefined;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: c.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}
