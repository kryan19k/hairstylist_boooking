import type { Content } from "./content";
import type { Locale } from "./i18n";

type WithEs = { es?: Record<string, string> };

/** Overlay an item's Spanish fields (when present and non-empty) on top of the English ones. */
export function pick<T extends WithEs>(item: T, locale: Locale): T {
  if (locale !== "es" || !item.es) return item;
  const over: Record<string, string> = {};
  for (const [k, v] of Object.entries(item.es)) if (v && v.trim()) over[k] = v;
  return { ...item, ...over };
}

export function localizeContent(c: Content, locale: Locale): Content {
  if (locale !== "es") return c;
  const settings = { ...c.settings, ...Object.fromEntries(Object.entries(c.settings.es ?? {}).filter(([, v]) => v && v.trim())) };
  settings.aftercare = c.settings.aftercare.map((a) => ({ ...a, t: a.tEs?.trim() || a.t, b: a.bEs?.trim() || a.b }));
  return {
    ...c,
    settings,
    services: c.services.map((x) => pick(x, locale)),
    addons: c.addons.map((x) => pick(x, locale)),
    looks: c.looks.map((x) => pick(x, locale)),
    reviews: c.reviews.map((x) => pick(x, locale)),
    faqs: c.faqs.map((x) => pick(x, locale)),
    team: c.team.map((x) => pick(x, locale)),
    products: c.products.map((x) => pick(x, locale)),
  };
}
