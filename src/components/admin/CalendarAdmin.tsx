"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { browserClient } from "@/lib/supabase";
import { revalidateSite } from "@/app/actions";
import { mergeSettings, type SiteSettings } from "@/lib/site";
import { dateKey, formatTime, fromMinutes, getSlots, parseDateKey, toMinutes, type Busy } from "@/lib/availability";
import { useTx, useLocale, useDuration, intlTag } from "@/lib/locale";
import { Btn, Field, inputCls, Notice } from "./ui";

type Status = "pending" | "confirmed" | "cancelled" | "completed";
type Booking = {
  id: string; ref: string; service_id: string; service_name: string; date: string; time: string; minutes: number;
  total: number; name: string; phone: string; email: string; notes: string; status: Status;
};
type Svc = { id: string; name: string; minutes: number; price: number };

const SCHEMA = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || "public";
const BLOCKED = "blocked";

// Makes the database itself refuse two overlapping appointments (the site already hides taken times;
// this also closes the tiny window where two people tap the same time at once).
export const OVERLAP_SQL = `create or replace function ${SCHEMA}.prevent_booking_overlap() returns trigger
language plpgsql security definer set search_path = ${SCHEMA} as $$
begin
  if new.status <> 'cancelled' and exists (
    select 1 from ${SCHEMA}.bookings b
    where b.id <> new.id and b.status <> 'cancelled' and b.date = new.date
      and (b.time::time, b.time::time + make_interval(mins => b.minutes))
          overlaps (new.time::time, new.time::time + make_interval(mins => new.minutes))
  ) then
    raise exception 'That time overlaps another appointment' using errcode = '23505';
  end if;
  return new;
end $$;
drop trigger if exists bookings_no_overlap on ${SCHEMA}.bookings;
create trigger bookings_no_overlap
  before insert or update of date, time, minutes, status on ${SCHEMA}.bookings
  for each row execute function ${SCHEMA}.prevent_booking_overlap();`;

const pill: Record<Status, string> = {
  pending: "bg-accent/25 text-accent2",
  confirmed: "bg-counter/25 text-counter",
  completed: "bg-ink-3 text-muted",
  cancelled: "bg-[#d9534f]/15 text-[#c0443f] line-through",
};

const monthStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOf = (b: { time: string; minutes: number }) => toMinutes(b.time) + b.minutes;

export default function CalendarAdmin() {
  const tx = useTx();
  const dur = useDuration();
  const tag = intlTag(useLocale());
  const [month, setMonth] = useState(() => monthStart(new Date()));
  const [today] = useState(() => dateKey(new Date()));
  const [sel, setSel] = useState(today);
  const [rows, setRows] = useState<Booking[]>([]);
  const [svcs, setSvcs] = useState<Svc[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [mode, setMode] = useState<"none" | "add" | "block">("none");
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // visible grid = whole weeks around the month
  const cells = useMemo(() => {
    const first = monthStart(month);
    const start = new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay());
    return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }, [month]);
  const rangeFrom = dateKey(cells[0]);
  const rangeTo = dateKey(cells[41]);

  const load = useCallback(async () => {
    const db = browserClient();
    const [b, s, st] = await Promise.all([
      db.from("bookings").select("*").gte("date", rangeFrom).lte("date", rangeTo).order("time", { ascending: true }),
      db.from("services").select("id,name,minutes,price,active").order("sort", { ascending: true }),
      db.from("site_settings").select("data").eq("id", 1).maybeSingle(),
    ]);
    if (b.error) setMsg({ kind: "error", text: b.error.message });
    else setRows(b.data as Booking[]);
    setSvcs(((s.data ?? []) as (Svc & { active?: boolean })[]).filter((x) => x.active !== false));
    setSettings(mergeSettings(st.data?.data));
  }, [rangeFrom, rangeTo]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch
    load();
  }, [load]);

  const live = rows.filter((r) => r.status !== "cancelled");
  const byDate = useMemo(() => {
    const m = new Map<string, Booking[]>();
    for (const r of rows) m.set(r.date, [...(m.get(r.date) ?? []), r]);
    return m;
  }, [rows]);
  const dayRows = (byDate.get(sel) ?? []).slice().sort((a, b) => a.time.localeCompare(b.time));
  const hoursToday = settings?.hours[parseDateKey(sel).getDay()] ?? null;

  const overlapping = (r: Booking) =>
    r.status !== "cancelled" &&
    dayRows.some((o) => o.id !== r.id && o.status !== "cancelled" && toMinutes(o.time) < endOf(r) && endOf(o) > toMinutes(r.time));

  const afterWrite = async (text: string) => {
    setMsg({ kind: "ok", text });
    setMode("none");
    await revalidateSite();
    load();
  };
  const fail = (err: { code?: string; message: string }) =>
    setMsg({ kind: "error", text: err.code === "23505" ? tx("That time overlaps another appointment.") : err.message });

  const setStatus = async (b: Booking, status: Status) => {
    const { error } = await browserClient().from("bookings").update({ status }).eq("id", b.id);
    if (error) return fail(error);
    await revalidateSite();
    load();
  };
  const remove = async (b: Booking) => {
    if (!window.confirm(tx("Permanently delete {name}'s booking?", { name: b.name }))) return;
    const { error } = await browserClient().from("bookings").delete().eq("id", b.id);
    if (error) return fail(error);
    await revalidateSite();
    load();
  };

  const monthLabel = month.toLocaleDateString(tag, { month: "long", year: "numeric" });
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 7 + i).toLocaleDateString(tag, { weekday: "short" }));

  return (
    <div>
      <h2 className="font-display text-3xl font-light">{tx("Calendar")}</h2>
      <p className="mt-1 max-w-xl text-sm text-muted">{tx("Every appointment at a glance. Click a day to see it, add a walk-in or phone booking, or block time off.")}</p>
      {msg && <div className="mt-4"><Notice kind={msg.kind}>{msg.text}</Notice></div>}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-2xl first-letter:uppercase">{monthLabel}</h3>
        <div className="flex gap-2">
          <Btn small onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>←</Btn>
          <Btn small onClick={() => { setMonth(monthStart(new Date())); setSel(today); }}>Today</Btn>
          <Btn small onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>→</Btn>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-px overflow-hidden rounded-2xl border border-line bg-line text-center text-[0.65rem] tracking-widest text-muted uppercase">
        {weekdays.map((w) => <div key={w} className="bg-ink-2 py-2">{w}</div>)}
        {cells.map((d) => {
          const key = dateKey(d);
          const list = (byDate.get(key) ?? []).filter((r) => r.status !== "cancelled");
          const inMonth = d.getMonth() === month.getMonth();
          const closed = settings ? !settings.hours[d.getDay()] : false;
          return (
            <button
              key={key}
              onClick={() => { setSel(key); setMode("none"); }}
              aria-pressed={sel === key}
              className={`relative min-h-16 bg-ink-2 p-1.5 text-left align-top transition sm:min-h-24 ${inMonth ? "" : "opacity-40"} ${sel === key ? "outline-2 -outline-offset-2 outline-accent" : "hover:bg-ink-3"}`}
            >
              <span className={`inline-grid size-6 place-items-center rounded-full text-xs font-semibold normal-case ${key === today ? "bg-accent text-on-accent" : closed ? "text-muted" : "text-cream"}`}>{d.getDate()}</span>
              <span className="mt-1 hidden space-y-0.5 sm:block">
                {list.slice(0, 3).map((r) => (
                  <span key={r.id} className={`block truncate rounded px-1 py-0.5 text-[0.65rem] normal-case ${r.service_id === BLOCKED ? "bg-ink-3 text-muted" : pill[r.status]}`}>
                    {formatTime(r.time)} {r.service_id === BLOCKED ? tx("Blocked") : r.name}
                  </span>
                ))}
                {list.length > 3 && <span className="block px-1 text-[0.65rem] text-muted normal-case">+{list.length - 3}</span>}
              </span>
              {list.length > 0 && <span className="absolute right-1.5 bottom-1.5 rounded-full bg-accent/25 px-1.5 text-[0.65rem] font-semibold text-accent2 sm:hidden">{list.length}</span>}
            </button>
          );
        })}
      </div>

      {/* the selected day */}
      <div className="mt-8 rounded-2xl border border-line bg-ink-2 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-2xl first-letter:uppercase">{parseDateKey(sel).toLocaleDateString(tag, { weekday: "long", month: "long", day: "numeric" })}</h3>
            <p className="text-sm text-muted">
              {hoursToday ? `${formatTime(hoursToday[0])} – ${formatTime(hoursToday[1])}` : tx("Closed this day")}
            </p>
          </div>
          <div className="flex gap-2">
            <Btn small kind="accent" onClick={() => setMode(mode === "add" ? "none" : "add")}>+ Add appointment</Btn>
            <Btn small onClick={() => setMode(mode === "block" ? "none" : "block")}>Block time</Btn>
          </div>
        </div>

        {mode === "add" && settings && <AddForm key={sel} date={sel} svcs={svcs} settings={settings} busy={live} onDone={afterWrite} onError={fail} />}
        {mode === "block" && settings && <BlockForm key={`b${sel}`} date={sel} settings={settings} busy={live} onDone={afterWrite} onError={fail} />}

        {dayRows.length === 0 ? (
          <p className="mt-6 text-sm text-muted">{tx("No appointments this day.")}</p>
        ) : (
          <ul className="mt-5 space-y-3">
            {dayRows.map((b) => {
              const blocked = b.service_id === BLOCKED;
              const clash = overlapping(b);
              return (
                <li key={b.id} className={`rounded-xl border p-3 sm:p-4 ${clash ? "border-[#d9534f]" : "border-line"} ${b.status === "cancelled" ? "opacity-60" : ""}`}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-display text-xl">{formatTime(b.time)} – {formatTime(fromMinutes(endOf(b)))}</p>
                      <p className="text-sm text-cream/80">
                        {blocked ? `${tx("Blocked")} · ${b.name}` : `${b.service_name} · ${b.name}`}
                        <span className="text-muted"> · {dur(b.minutes)}</span>
                      </p>
                      {!blocked && (b.phone || b.email) && (
                        <p className="text-xs text-muted">
                          {b.phone && <a className="text-accent2 hover:underline" href={`tel:${b.phone}`}>{b.phone}</a>}
                          {b.phone && b.email ? " · " : ""}
                          {b.email && <a className="text-accent2 hover:underline" href={`mailto:${b.email}`}>{b.email}</a>}
                        </p>
                      )}
                      {b.notes && !blocked && <p className="mt-1 text-xs text-cream/70">{b.notes}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {!blocked && <span className={`rounded-full px-3 py-1 text-xs uppercase ${pill[b.status]}`}>{tx(b.status)}</span>}
                      {clash && <span className="rounded-full bg-[#d9534f]/15 px-3 py-1 text-xs text-[#c0443f]">{tx("Overlaps another appointment")}</span>}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {!blocked && b.status === "pending" && <Btn small kind="accent" onClick={() => setStatus(b, "confirmed")}>Confirm</Btn>}
                    {!blocked && b.status === "confirmed" && <Btn small onClick={() => setStatus(b, "completed")}>Mark completed</Btn>}
                    {!blocked && b.status !== "cancelled" && <Btn small onClick={() => setStatus(b, "cancelled")}>Cancel</Btn>}
                    {!blocked && b.status === "cancelled" && <Btn small onClick={() => setStatus(b, "pending")}>Restore</Btn>}
                    <Btn small kind="danger" onClick={() => remove(b)}>Delete</Btn>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <details className="mt-8 rounded-2xl border border-line bg-ink-2 p-4 text-sm">
        <summary className="cursor-pointer font-medium">{tx("Extra protection against double-booking")}</summary>
        <p className="mt-3 text-muted">{tx("The site already hides times that would overlap. Run this once in Supabase → SQL Editor so the database itself refuses overlapping appointments too.")}</p>
        <pre className="mt-3 max-h-56 overflow-auto rounded-xl border border-line bg-ink p-3 text-xs whitespace-pre-wrap">{OVERLAP_SQL}</pre>
        <div className="mt-3">
          <Btn small kind="accent" onClick={() => navigator.clipboard.writeText(OVERLAP_SQL).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); })}>{copied ? "Copied ✓" : "Copy SQL"}</Btn>
        </div>
      </details>
    </div>
  );
}

type FormProps = {
  date: string; settings: SiteSettings; busy: Booking[];
  onDone: (text: string) => void; onError: (e: { code?: string; message: string }) => void;
};

function AddForm({ date, svcs, settings, busy, onDone, onError }: FormProps & { svcs: Svc[] }) {
  const tx = useTx();
  const dur = useDuration();
  const [svcId, setSvcId] = useState(svcs[0]?.id ?? "");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [busyBtn, setBusyBtn] = useState(false);
  const svc = svcs.find((s) => s.id === svcId);
  const busyList: Busy[] = busy.map((b) => ({ date: b.date, time: b.time, minutes: b.minutes }));
  const slots = svc ? getSlots(date, svc.minutes, { hours: settings.hours, step: settings.slotStepMinutes, leadHours: 0, busy: busyList }).filter((s) => !s.taken) : [];
  const chosen = slots.some((s) => s.time === time) ? time : slots[0]?.time ?? "";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!svc || !chosen || name.trim().length < 2) return;
    setBusyBtn(true);
    const { error } = await browserClient().from("bookings").insert({
      ref: `MAN-${crypto.randomUUID().slice(0, 5).toUpperCase()}`,
      service_id: svc.id, service_name: svc.name, addon_ids: [], date, time: chosen, minutes: svc.minutes,
      total: svc.price, deposit: 0, name: name.trim(), email: "", phone: phone.trim(), first_visit: false,
      notes: notes.trim(), status: "confirmed",
    });
    setBusyBtn(false);
    if (error) return onError(error);
    onDone(tx("Appointment added."));
  };

  return (
    <form onSubmit={submit} className="mt-5 grid gap-4 rounded-xl border border-accent/40 bg-ink p-4 sm:grid-cols-2">
      <Field label="Service">
        <select className={inputCls} value={svcId} onChange={(e) => setSvcId(e.target.value)}>
          {svcs.map((s) => <option key={s.id} value={s.id}>{s.name} · {dur(s.minutes)}</option>)}
        </select>
      </Field>
      <Field label="Time">
        {slots.length ? (
          <select className={inputCls} value={chosen} onChange={(e) => setTime(e.target.value)}>
            {slots.map((s) => <option key={s.time} value={s.time}>{formatTime(s.time)} – {formatTime(s.endsAt)}</option>)}
          </select>
        ) : (
          <p className="rounded-xl border border-line px-3.5 py-2.5 text-sm text-muted">{tx("No open times for that service on this day.")}</p>
        )}
      </Field>
      <Field label="Client name"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required /></Field>
      <Field label="Phone"><input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" /></Field>
      <Field label="Notes" className="sm:col-span-2"><input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
      <div className="sm:col-span-2"><Btn type="submit" kind="accent" disabled={busyBtn || !chosen || !svc}>{busyBtn ? "Saving…" : "Save appointment"}</Btn></div>
    </form>
  );
}

function BlockForm({ date, settings, busy, onDone, onError }: FormProps) {
  const tx = useTx();
  const hours = settings.hours[parseDateKey(date).getDay()];
  const [start, setStart] = useState(hours?.[0] ?? "09:00");
  const [len, setLen] = useState("60");
  const [reason, setReason] = useState("");
  const [busyBtn, setBusyBtn] = useState(false);
  const open = hours ? toMinutes(hours[0]) : 9 * 60;
  const close = hours ? toMinutes(hours[1]) : 18 * 60;
  const times: string[] = [];
  for (let t = open; t < close; t += settings.slotStepMinutes) times.push(fromMinutes(t));
  const allDay = len === "all";
  const minutes = allDay ? close - open : Number(len);
  const startAt = allDay ? fromMinutes(open) : start;
  const clash = busy.some((b) => toMinutes(b.time) < toMinutes(startAt) + minutes && endOf(b) > toMinutes(startAt));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyBtn(true);
    const { error } = await browserClient().from("bookings").insert({
      ref: `BLK-${crypto.randomUUID().slice(0, 5).toUpperCase()}`,
      service_id: BLOCKED, service_name: "Blocked", addon_ids: [], date, time: startAt, minutes,
      total: 0, deposit: 0, name: reason.trim() || tx("Time off"), email: "", phone: "", first_visit: false, notes: "", status: "confirmed",
    });
    setBusyBtn(false);
    if (error) return onError(error);
    onDone(tx("Time blocked."));
  };

  return (
    <form onSubmit={submit} className="mt-5 grid gap-4 rounded-xl border border-line bg-ink p-4 sm:grid-cols-3">
      <Field label="Start">
        <select className={inputCls} value={startAt} disabled={allDay} onChange={(e) => setStart(e.target.value)}>
          {times.map((t) => <option key={t} value={t}>{formatTime(t)}</option>)}
        </select>
      </Field>
      <Field label="Length">
        <select className={inputCls} value={len} onChange={(e) => setLen(e.target.value)}>
          {[30, 60, 90, 120, 180, 240].map((m) => <option key={m} value={m}>{m >= 60 ? `${m / 60} h` : `${m} min`}</option>)}
          <option value="all">{tx("All day")}</option>
        </select>
      </Field>
      <Field label="Reason (optional)"><input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={tx("Lunch, day off…")} /></Field>
      {clash && <div className="sm:col-span-3"><Notice kind="error">That time overlaps another appointment.</Notice></div>}
      <div className="sm:col-span-3"><Btn type="submit" kind="accent" disabled={busyBtn || clash}>{busyBtn ? "Saving…" : "Block this time"}</Btn></div>
    </form>
  );
}
