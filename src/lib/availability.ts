import type { Hours } from "./site";
import type { TFn } from "./locale";

export const OWNER_ID = "owner";

export type Slot = { time: string; endsAt: string; taken: boolean; /** who is free at this time (staff-aware lookups) */ memberIds?: string[] };
export type Busy = { date: string; time: string; minutes: number; /** whose chair; blank = the owner */ memberId?: string };
export type StaffMember = {
  id: string;
  name: string;
  role?: string;
  photoUrl?: string;
  /** Weekly working hours. null = follows the shop hours. A day set to null = day off. */
  schedule: Hours | null;
  /** Takes online bookings. */
  takes: boolean;
  /** Services this person performs. Empty = all of them. */
  serviceIds: string[];
};
export type TimeOff = { memberId: string; from: string; to: string };
export type SlotOpts = {
  hours: Hours;
  step: number;
  leadHours: number;
  now?: Date;
  busy?: Busy[];
  /** Pretend ~1/3 of slots are taken. Only used before the real database is live. */
  demo?: boolean;
  /** Staff-aware lookups: who works when, who is off, whose chair to look at. */
  staff?: StaffMember[];
  timeOff?: TimeOff[];
  /** "any" (default) or one staff id. */
  memberId?: string;
  /** Only count staff who perform this service. */
  serviceId?: string;
};

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

export const formatDuration = (minutes: number, es = false) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h ? (es ? `${h} h` : `${h} hr${h > 1 ? "s" : ""}`) : "", m ? `${m} min` : ""].filter(Boolean).join(" ");
};

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 100;
}

export const hoursFor = (key: string, hours: Hours) => hours[parseDateKey(key).getDay()] ?? null;

/** Working window per weekday for one person: their schedule clipped to the shop's opening hours. */
export function staffWindow(shop: Hours, schedule: Hours | null | undefined): Hours {
  if (!schedule) return shop;
  const out: Hours = {};
  for (let d = 0; d < 7; d++) {
    const s = shop[d];
    const m = schedule[d];
    if (!s || !m) { out[d] = null; continue; }
    const from = Math.max(toMinutes(s[0]), toMinutes(m[0]));
    const to = Math.min(toMinutes(s[1]), toMinutes(m[1]));
    out[d] = to > from ? [fromMinutes(from), fromMinutes(to)] : null;
  }
  return out;
}

export const isOff = (memberId: string, key: string, timeOff: TimeOff[] = []) =>
  timeOff.some((t) => t.memberId === memberId && key >= t.from && key <= t.to);

/**
 * Slots for a date. With `staff`, a time only counts when someone who works that day (and is not off,
 * and does this service) is free; each slot lists who. Without it, it is a single shop-wide calendar.
 * A slot is taken if it would overlap an existing booking on that person's chair.
 */
export function getSlots(key: string, durationMin: number, o: SlotOpts): Slot[] {
  if (!o.staff || o.staff.length === 0) return trackSlots(key, durationMin, o, o.hours, o.busy ?? []);
  const pool = o.staff.filter(
    (m) => m.takes && (!o.memberId || o.memberId === "any" || m.id === o.memberId) && (!o.serviceId || m.serviceIds.length === 0 || m.serviceIds.includes(o.serviceId)),
  );
  const merged = new Map<string, Slot>();
  for (const m of pool) {
    if (isOff(m.id, key, o.timeOff)) continue;
    const mine = (o.busy ?? []).filter((b) => (b.memberId || OWNER_ID) === m.id);
    for (const s of trackSlots(key, durationMin, o, staffWindow(o.hours, m.schedule), mine)) {
      const e = merged.get(s.time) ?? { time: s.time, endsAt: s.endsAt, taken: true, memberIds: [] };
      if (!s.taken) { e.taken = false; e.memberIds!.push(m.id); }
      merged.set(s.time, e);
    }
  }
  return [...merged.values()].sort((a, b) => a.time.localeCompare(b.time));
}

function trackSlots(key: string, durationMin: number, o: SlotOpts, hours: Hours, allBusy: Busy[]): Slot[] {
  const day = hoursFor(key, hours);
  if (!day) return [];
  const open = toMinutes(day[0]);
  const close = toMinutes(day[1]);
  const { now } = o;
  if (now && parseDateKey(key) < parseDateKey(dateKey(now))) return [];
  const isToday = now ? dateKey(now) === key : false;
  const earliest = now ? now.getHours() * 60 + now.getMinutes() + o.leadHours * 60 : -1;
  const busy = allBusy.filter((b) => b.date === key).map((b) => [toMinutes(b.time), toMinutes(b.time) + b.minutes] as const);

  const slots: Slot[] = [];
  for (let t = open; t + durationMin <= close; t += o.step) {
    if (isToday && t < earliest) continue;
    const time = fromMinutes(t);
    const clash = busy.some(([s, e]) => t < e && t + durationMin > s);
    const taken = clash || (!!o.demo && hash(`${key}T${time}`) < 34);
    slots.push({ time, endsAt: fromMinutes(t + durationMin), taken });
  }
  return slots;
}

export function nextAvailable(now: Date, durationMin: number, o: Omit<SlotOpts, "now">): { key: string; time: string } | null {
  for (let i = 0; i < 30; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const key = dateKey(d);
    const slot = getSlots(key, durationMin, { ...o, now }).find((s) => !s.taken);
    if (slot) return { key, time: slot.time };
  }
  return null;
}

export function openNowLabel(now: Date, hours: Hours, t: TFn, tag = "en-US") {
  const today = hours[now.getDay()];
  const mins = now.getHours() * 60 + now.getMinutes();
  if (today && mins >= toMinutes(today[0]) && mins < toMinutes(today[1])) return t("open.until", { time: formatTime(today[1]) });
  for (let i = 0; i < 8; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const h = hours[d.getDay()];
    if (!h) continue;
    if (i === 0 && mins >= toMinutes(h[1])) continue;
    if (i === 0) return t("open.today", { time: formatTime(h[0]) });
    if (i === 1) return t("open.tomorrow", { time: formatTime(h[0]) });
    return t("open.day", { day: d.toLocaleDateString(tag, { weekday: "long" }), time: formatTime(h[0]) });
  }
  return t("open.closed");
}
