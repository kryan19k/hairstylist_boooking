import { cache } from "react";
import { addons as defaultAddons, faqs as defaultFaqs, looks as defaultLooks, reviews as defaultReviews, services as defaultServices } from "./data";
import type { Addon, Faq, Look, Review, Service } from "./data";
import { defaultSettings, mergeSettings, type SiteSettings } from "./site";
import { hasSupabase, serverClient } from "./supabase";
import type { Busy } from "./availability";

export type Content = {
  settings: SiteSettings;
  services: Service[];
  addons: Addon[];
  looks: Look[];
  reviews: Review[];
  faqs: Faq[];
  busy: Busy[];
  /** true once the owner's database is the source of truth (starter content loaded). */
  live: boolean;
};

const withIds = <T extends object>(rows: T[], prefix: string) => rows.map((r, i) => ({ ...r, id: `${prefix}-${i}` }));

export const fallbackContent = (): Content => ({
  settings: defaultSettings,
  services: defaultServices,
  addons: defaultAddons,
  looks: defaultLooks,
  reviews: withIds(defaultReviews, "r") as Review[],
  faqs: withIds(defaultFaqs, "f") as Faq[],
  busy: [],
  live: false,
});

/* ---- row ⇄ app mappers (shared with the admin dashboard) ---- */
export const mapService = (r: Record<string, unknown>): Service => ({
  id: r.id as string, name: r.name as string, category: r.category as Service["category"], blurb: (r.blurb as string) ?? "",
  price: Number(r.price), minutes: Number(r.minutes), deposit: Number(r.deposit),
});
export const mapAddon = (r: Record<string, unknown>): Addon => ({
  id: r.id as string, name: r.name as string, blurb: (r.blurb as string) ?? "", price: Number(r.price), minutes: Number(r.minutes),
});
export const mapLook = (r: Record<string, unknown>): Look => ({
  id: r.id as string, title: r.title as string, category: r.category as Look["category"], kind: r.kind as Look["kind"],
  palette: ((r.palette as string[]) ?? ["#3a2418", "#b98a5e", "#f1dcc0"]).slice(0, 3) as Look["palette"],
  serviceId: (r.service_id as string) ?? "", story: (r.story as string) ?? "", hours: (r.hours as string) ?? "",
  seed: Number(r.seed) || 1, image: (r.image_url as string) || undefined, before: (r.before_url as string) || undefined,
});

/** Fetch everything the public site needs. Never throws: falls back to starter content. */
export const getContent = cache(async (): Promise<Content> => {
  const fb = fallbackContent();
  if (!hasSupabase) return fb;
  try {
    const db = serverClient();
    const ord = { ascending: true } as const;
    const today = new Date();
    const to = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 60);
    const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    const [st, sv, ad, lk, rv, fq, busy] = await Promise.all([
      db.from("site_settings").select("data").eq("id", 1).maybeSingle(),
      db.from("services").select("*").order("sort", ord),
      db.from("addons").select("*").order("sort", ord),
      db.from("looks").select("*").order("sort", ord),
      db.from("reviews").select("*").order("sort", ord),
      db.from("faqs").select("*").order("sort", ord),
      db.rpc("busy_slots", { from_date: iso(today), to_date: iso(to) }),
    ]);
    if (st.error) return fb; // tables not created yet
    const settings = mergeSettings(st.data?.data);
    const busyList: Busy[] = (busy.data ?? []).map((b: { date: string; time: string; minutes: number }) => ({ date: b.date, time: b.time, minutes: b.minutes }));
    if (!settings.seeded) return { ...fb, settings, busy: busyList };
    return {
      settings,
      services: (sv.data ?? []).map(mapService),
      addons: (ad.data ?? []).map(mapAddon),
      looks: (lk.data ?? []).map(mapLook),
      reviews: (rv.data ?? []).map((r) => ({ id: r.id, name: r.name, service: r.service, quote: r.quote, stars: r.stars })),
      faqs: (fq.data ?? []).map((f) => ({ id: f.id, q: f.q, a: f.a })),
      busy: busyList,
      live: true,
    };
  } catch {
    return fb;
  }
});
