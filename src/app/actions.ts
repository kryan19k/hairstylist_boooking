"use server";
import { addons, services } from "@/lib/data";
import { getSlots, hoursFor } from "@/lib/availability";

export type BookingInput = {
  serviceId: string;
  addonIds: string[];
  date: string; // YYYY-MM-DD (salon-local)
  time: string; // HH:MM
  name: string;
  email: string;
  phone: string;
  firstVisit: boolean;
  notes: string;
  website?: string; // honeypot — real users never fill this
};

export type BookingResult =
  | { ok: true; ref: string; total: number; deposit: number; minutes: number }
  | { ok: false; error: string };

// TODO(supabase): replace this in-memory store with an insert into `bookings`
// (unique on start_at) and a read of existing bookings for availability.
const store = globalThis as unknown as { __bookings?: Map<string, BookingInput & { ref: string }> };
const bookings = (store.__bookings ??= new Map());

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function createBooking(input: BookingInput): Promise<BookingResult> {
  if (input.website) return { ok: false, error: "Something went wrong. Please try again." }; // bot

  const service = services.find((s) => s.id === input.serviceId);
  if (!service) return { ok: false, error: "That service is no longer available." };
  const picked = addons.filter((a) => input.addonIds.includes(a.id));

  const name = input.name?.trim() ?? "";
  const email = input.email?.trim() ?? "";
  const phone = input.phone?.replace(/[^\d+]/g, "") ?? "";
  if (name.length < 2 || name.length > 80) return { ok: false, error: "Please enter your name." };
  if (!EMAIL.test(email) || email.length > 120) return { ok: false, error: "Please enter a valid email." };
  if (phone.replace(/\D/g, "").length < 7) return { ok: false, error: "Please enter a valid phone number." };
  if ((input.notes ?? "").length > 1000) return { ok: false, error: "Notes are too long (1000 characters max)." };

  const minutes = service.minutes + picked.reduce((n, a) => n + a.minutes, 0);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || !hoursFor(input.date)) return { ok: false, error: "We're closed that day." };

  const taken = new Set([...bookings.values()].map((b) => `${b.date}T${b.time}`));
  const slot = getSlots(input.date, minutes, undefined, taken).find((s) => s.time === input.time);
  if (!slot || slot.taken) return { ok: false, error: "Sorry, that time was just taken. Please pick another." };

  const ref = `AU-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  bookings.set(ref, { ...input, name, email, ref });

  return {
    ok: true,
    ref,
    minutes,
    total: service.price + picked.reduce((n, a) => n + a.price, 0),
    deposit: service.deposit,
  };
}
