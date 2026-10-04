// Single source of truth for brand details. Everything here is placeholder copy —
// swap in the real studio info and the whole site updates.
export const site = {
  name: "Aurelle",
  tagline: "Hair Atelier",
  stylist: "Aurelle Voss",
  city: "Brooklyn, NY",
  address: "214 Wythe Ave, Suite 3",
  phone: "(555) 014-2277",
  email: "hello@aurelle.studio",
  instagram: "aurelle.hair",
  yearsExperience: 12,
  clientsServed: "4,200+",
  rating: 4.98,
  // JS getDay(): 0 = Sun … 6 = Sat. null = closed. Times are 24h "HH:MM".
  hours: {
    0: null,
    1: null,
    2: ["10:00", "19:00"],
    3: ["10:00", "19:00"],
    4: ["10:00", "20:00"],
    5: ["10:00", "19:00"],
    6: ["09:00", "17:00"],
  } as Record<number, [string, string] | null>,
  slotStepMinutes: 30,
  leadHours: 3,
} as const;

export const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
