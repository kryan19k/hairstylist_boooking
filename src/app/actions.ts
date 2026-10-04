"use server";
import { revalidatePath } from "next/cache";
import { getContent } from "@/lib/content";
import { getSlots, type Busy } from "@/lib/availability";
import { hasSupabase, serverClient } from "@/lib/supabase";

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
  | { ok: false; error: string; code?: string };

// Used only until supabase/schema.sql has been run, so the site is demoable before the DB exists.
const g = globalThis as unknown as { __memBookings?: Busy[] };
const memory = (g.__memBookings ??= []);

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function getBusy(): Promise<Busy[]> {
  try {
    const { busy } = await getContent();
    return [...busy, ...memory];
  } catch {
    return [...memory];
  }
}

export async function createBooking(input: BookingInput): Promise<BookingResult> {
  if (input.website) return { ok: false, error: "Something went wrong. Please try again.", code: "bot" }; // bot

  const { services, addons, settings } = await getContent();
  const service = services.find((s) => s.id === input.serviceId);
  if (!service) return { ok: false, error: "That service is no longer available.", code: "service" };
  const picked = addons.filter((a) => input.addonIds.includes(a.id));

  const name = input.name?.trim() ?? "";
  const email = input.email?.trim() ?? "";
  const phone = input.phone?.trim() ?? "";
  if (name.length < 2 || name.length > 80) return { ok: false, error: "Please enter your name.", code: "name" };
  if (!EMAIL.test(email) || email.length > 120) return { ok: false, error: "Please enter a valid email.", code: "email" };
  if (phone.replace(/\D/g, "").length < 7 || phone.length > 30) return { ok: false, error: "Please enter a valid phone number.", code: "phone" };
  const notes = (input.notes ?? "").trim();
  if (notes.length > 1000) return { ok: false, error: "Notes are too long (1000 characters max).", code: "notes" };

  const minutes = service.minutes + picked.reduce((n, a) => n + a.minutes, 0);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) return { ok: false, error: "Please pick a date.", code: "date" };

  const busy = await getBusy();
  const slot = getSlots(input.date, minutes, { hours: settings.hours, step: settings.slotStepMinutes, leadHours: settings.leadHours, busy }).find((s) => s.time === input.time);
  if (!slot || slot.taken) return { ok: false, error: "Sorry, that time was just taken. Please pick another.", code: "taken" };

  const total = service.price + picked.reduce((n, a) => n + a.price, 0);
  const ref = `EE-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const ok = { ok: true as const, ref, minutes, total, deposit: service.deposit };

  if (hasSupabase) {
    const { error } = await serverClient().from("bookings").insert({
      ref, service_id: service.id, service_name: service.name, addon_ids: picked.map((a) => a.id),
      date: input.date, time: input.time, minutes, total, deposit: service.deposit,
      name, email, phone, first_visit: !!input.firstVisit, notes,
    });
    if (!error) return ok;
    if (error.code === "23505") return { ok: false, error: "Sorry, that time was just taken. Please pick another.", code: "taken" };
    // Schema not installed yet → fall through to in-memory demo mode.
    if (error.code !== "42P01" && error.code !== "PGRST205") {
      console.error("[booking] insert failed:", error.message);
      return { ok: false, error: "We couldn't save your booking. Please try again or call the salon.", code: "save" };
    }
  }
  memory.push({ date: input.date, time: input.time, minutes });
  return ok;
}

/** Called by the admin dashboard after saving so visitors see changes immediately. */
export async function revalidateSite() {
  revalidatePath("/", "layout");
}
