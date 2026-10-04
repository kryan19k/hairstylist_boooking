// Default (fallback) site settings. The owner overrides these from /admin → Studio;
// whatever is saved in Supabase `site_settings` is merged over this object.
export type Hours = Record<number, [string, string] | null>;

export type SiteSettings = {
  name: string;
  tagline: string;
  stylist: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  instagram: string;
  yearsExperience: number;
  clientsServed: string;
  rating: number;
  /** JS getDay(): 0 = Sun … 6 = Sat. null = closed. 24h "HH:MM". */
  hours: Hours;
  slotStepMinutes: number;
  leadHours: number;
  heroBlurb: string;
  aboutTitle: string;
  aboutBody: string;
  portraitUrl: string;
  directionsNote: string;
  defaultShade: string;
  defaultTheme: "light" | "dark";
  seeded: boolean;
  /** Hero headline, three words (blank = built-in text). */
  heroWord1: string;
  heroWord2: string;
  heroWord3: string;
  /** Words in the ticker under the hero, separated by commas (blank = built-in list). */
  marquee: string;
  /** "Meet Fabiola" section labels (blank = built-in text). */
  aboutKicker: string;
  aboutMeet: string;
  aboutCta: string;
  /** Gift card section. */
  showGiftCards: boolean;
  giftAmounts: string;
  /** Aftercare tips (empty list = built-in four tips). */
  aftercare: AftercareTip[];
  /** Spanish overrides for owner-written text; empty = fall back to the English / built-in text. */
  es: Partial<Record<EsKey, string>>;
};

export type AftercareTip = { t: string; b: string; tEs?: string; bEs?: string };
export type EsKey =
  | "tagline" | "heroBlurb" | "aboutTitle" | "aboutBody" | "directionsNote"
  | "heroWord1" | "heroWord2" | "heroWord3" | "marquee" | "aboutKicker" | "aboutMeet" | "aboutCta";

export const defaultSettings: SiteSettings = {
  name: "Ella El",
  tagline: "Beauty Salon",
  stylist: "Fabiola Herta",
  city: "San Jacinto, CA",
  address: "1451 S San Jacinto Ave, San Jacinto, CA 92583",
  phone: "",
  email: "",
  instagram: "",
  yearsExperience: 12,
  clientsServed: "4,200+",
  rating: 4.98,
  hours: {
    0: null,
    1: null,
    2: ["10:00", "19:00"],
    3: ["10:00", "19:00"],
    4: ["10:00", "20:00"],
    5: ["10:00", "19:00"],
    6: ["09:00", "17:00"],
  },
  slotStepMinutes: 30,
  leadHours: 3,
  heroBlurb: "A private color & cutting salon. Every head of hair is a one-off composition: tone, light and shape, built around you.",
  aboutTitle: "Hair is the one accessory you never take off.",
  aboutBody:
    "I'm Fabiola. For over a decade I've built my work on slow, honest consultations and color that grows out beautifully. No rushed chairs, no cookie-cutter formulas: one client at a time, in a calm salon where you can exhale.",
  portraitUrl: "",
  directionsNote: "Free parking out front.",
  defaultShade: "honey",
  defaultTheme: "light",
  seeded: false,
  heroWord1: "",
  heroWord2: "",
  heroWord3: "",
  marquee: "",
  aboutKicker: "",
  aboutMeet: "",
  aboutCta: "",
  showGiftCards: true,
  giftAmounts: "50, 100, 150, 250",
  aftercare: [],
  es: {
    tagline: "Salón de belleza",
    heroBlurb: "Un salón privado de color y corte. Cada cabello es una composición única: tono, luz y forma, creada para ti.",
    aboutTitle: "El cabello es el único accesorio que nunca te quitas.",
    aboutBody:
      "Soy Fabiola. Por más de una década he construido mi trabajo sobre consultas lentas y honestas y un color que crece de forma hermosa. Sin prisas, sin fórmulas de molde: una persona a la vez, en un salón tranquilo donde puedes respirar.",
    directionsNote: "Estacionamiento gratis al frente.",
  },
};

export const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Overlay the owner's saved settings on the defaults (hours keys arrive as strings from JSON). */
export function mergeSettings(data: Partial<SiteSettings> | null | undefined): SiteSettings {
  const d = data ?? {};
  // JSON turns numeric keys into strings and may drop days; rebuild hours safely.
  const hours = { ...defaultSettings.hours, ...(d.hours ?? {}) };
  const es = { ...defaultSettings.es, ...(d.es ?? {}) };
  // If the owner rewrote the English text but never touched the (default) Spanish, drop the stale
  // default Spanish so Spanish visitors see the owner's text instead of the old sample copy.
  for (const k of Object.keys(defaultSettings.es) as EsKey[]) {
    const edited = d[k as keyof SiteSettings] !== undefined && d[k as keyof SiteSettings] !== defaultSettings[k as keyof SiteSettings];
    if (edited && (!d.es?.[k] || d.es[k] === defaultSettings.es[k])) es[k] = "";
  }
  return { ...defaultSettings, ...d, hours, es, aftercare: Array.isArray(d.aftercare) ? d.aftercare : [] };
}
