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
};

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
  defaultShade: "gold",
  defaultTheme: "light",
  seeded: false,
};

export const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Overlay the owner's saved settings on the defaults (hours keys arrive as strings from JSON). */
export function mergeSettings(data: Partial<SiteSettings> | null | undefined): SiteSettings {
  const d = data ?? {};
  // JSON turns numeric keys into strings and may drop days; rebuild hours safely.
  const hours = { ...defaultSettings.hours, ...(d.hours ?? {}) };
  return { ...defaultSettings, ...d, hours };
}

