import { site } from "./site";

export type Slot = { time: string; endsAt: string; taken: boolean };

const pad = (n: number) => String(n).padStart(2, "0");

export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
export const fromMinutes = (mins: number) => `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;

export const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseDateKey = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const formatTime = (hhmm: string) => {
  const mins = toMinutes(hhmm);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h % 12 || 12}${m ? `:${pad(m)}` : ""} ${h >= 12 ? "pm" : "am"}`;
};

export const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h ? `${h} hr${h > 1 ? "s" : ""}` : "", m ? `${m} min` : ""].filter(Boolean).join(" ");
};

// Deterministic pseudo-random so "already booked" slots look real and are the
// same on server and client. Replaced by a Supabase query when the DB is wired.
function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 100;
}

export function hoursFor(key: string) {
  return site.hours[parseDateKey(key).getDay()];
}

/** Slots for a date. `now` (client local) trims anything inside the lead time. */
export function getSlots(key: string, durationMin: number, now?: Date, extraTaken?: Set<string>): Slot[] {
  const hours = hoursFor(key);
  if (!hours) return [];
  const open = toMinutes(hours[0]);
  const close = toMinutes(hours[1]);
  const slots: Slot[] = [];
  const earliest = now ? now.getHours() * 60 + now.getMinutes() + site.leadHours * 60 : -1;
  const isToday = now ? dateKey(now) === key : false;
  const isPast = now ? parseDateKey(key) < parseDateKey(dateKey(now)) : false;
  if (isPast) return [];

  for (let t = open; t + durationMin <= close; t += site.slotStepMinutes) {
    if (isToday && t < earliest) continue;
    const time = fromMinutes(t);
    const taken = hash(`${key}T${time}`) < 34 || !!extraTaken?.has(`${key}T${time}`);
    slots.push({ time, endsAt: fromMinutes(t + durationMin), taken });
  }
  return slots;
}

export function nextAvailable(now: Date, durationMin = 60): { key: string; time: string } | null {
  for (let i = 0; i < 30; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const key = dateKey(d);
    const slot = getSlots(key, durationMin, now).find((s) => !s.taken);
    if (slot) return { key, time: slot.time };
  }
  return null;
}

export function openNowLabel(now: Date) {
  const hours = site.hours[now.getDay()];
  const mins = now.getHours() * 60 + now.getMinutes();
  if (hours && mins >= toMinutes(hours[0]) && mins < toMinutes(hours[1])) {
    return `Open until ${formatTime(hours[1])}`;
  }
  for (let i = 0; i < 8; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const h = site.hours[d.getDay()];
    if (!h) continue;
    if (i === 0 && mins >= toMinutes(h[1])) continue;
    if (i === 0) return `Opens today ${formatTime(h[0])}`;
    return `Opens ${i === 1 ? "tomorrow" : d.toLocaleDateString("en-US", { weekday: "long" })} ${formatTime(h[0])}`;
  }
  return "Closed";
}
