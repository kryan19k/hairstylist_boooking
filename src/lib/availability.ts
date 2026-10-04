import type { Hours } from "./site";

export type Slot = { time: string; endsAt: string; taken: boolean };
export type Busy = { date: string; time: string; minutes: number };
export type SlotOpts = {
  hours: Hours;
  step: number;
  leadHours: number;
  now?: Date;
  busy?: Busy[];
  /** Pretend ~1/3 of slots are taken. Only used before the real database is live. */
  demo?: boolean;
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

export const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h ? `${h} hr${h > 1 ? "s" : ""}` : "", m ? `${m} min` : ""].filter(Boolean).join(" ");
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

/** Slots for a date. A slot is taken if it would overlap any existing booking. */
export function getSlots(key: string, durationMin: number, o: SlotOpts): Slot[] {
  const day = hoursFor(key, o.hours);
  if (!day) return [];
  const open = toMinutes(day[0]);
  const close = toMinutes(day[1]);
  const { now } = o;
  if (now && parseDateKey(key) < parseDateKey(dateKey(now))) return [];
  const isToday = now ? dateKey(now) === key : false;
  const earliest = now ? now.getHours() * 60 + now.getMinutes() + o.leadHours * 60 : -1;
  const busy = (o.busy ?? []).filter((b) => b.date === key).map((b) => [toMinutes(b.time), toMinutes(b.time) + b.minutes] as const);

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

export function openNowLabel(now: Date, hours: Hours) {
  const today = hours[now.getDay()];
  const mins = now.getHours() * 60 + now.getMinutes();
  if (today && mins >= toMinutes(today[0]) && mins < toMinutes(today[1])) return `Open until ${formatTime(today[1])}`;
  for (let i = 0; i < 8; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const h = hours[d.getDay()];
    if (!h) continue;
    if (i === 0 && mins >= toMinutes(h[1])) continue;
    if (i === 0) return `Opens today ${formatTime(h[0])}`;
    return `Opens ${i === 1 ? "tomorrow" : d.toLocaleDateString("en-US", { weekday: "long" })} ${formatTime(h[0])}`;
  }
  return "Closed";
}
