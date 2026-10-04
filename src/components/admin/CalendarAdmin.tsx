"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { browserClient } from "@/lib/supabase";
import { revalidateSite } from "@/app/actions";
import { mergeSettings, type SiteSettings } from "@/lib/site";
import {
  dateKey, formatTime, fromMinutes, getSlots, isOff, OWNER_ID, parseDateKey, staffWindow, toMinutes,
  type Busy, type StaffMember, type TimeOff,
} from "@/lib/availability";
import { buildStaff } from "@/lib/staff";
import { STAFF_SQL } from "@/lib/staff-sql";
import type { TeamMember } from "@/lib/data";
import { useTx, useLocale, useDuration, intlTag } from "@/lib/locale";
import { Btn, Field, inputCls, Notice } from "./ui";

type Status = "pending" | "confirmed" | "cancelled" | "completed";
type Booking = {
  id: string; ref: string; service_id: string; service_name: string; date: string; time: string; minutes: number;
  total: number; name: string; phone: string; email: string; notes: string; status: Status; member_id?: string;
};
type Svc = { id: string; name: string; minutes: number; price: number };

const BLOCKED = "blocked";
const who = (b: { member_id?: string }) => b.member_id || OWNER_ID;

const pill: Record<Status, string> = {
  pending: "bg-accent/25 text-accent2",
  confirmed: "bg-counter/25 text-counter",
  completed: "bg-ink-3 text-muted",
  cancelled: "bg-[#d9534f]/15 text-[#c0443f] line-through",
};

const monthStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOf = (b: { time: string; minutes: number }) => toMinutes(b.time) + b.minutes;

type TeamRow = { id: string; name: string; role?: string; photo_url?: string; takes_bookings?: boolean; schedule?: TeamMember["schedule"]; service_ids?: string[] };

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
  const [team, setTeam] = useState<TeamRow[]>([]);
  const [timeOff, setTimeOff] = useState<TimeOff[]>([]);
  const [filter, setFilter] = useState<string>("all");
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
    const [b, s, st, tm, to] = await Promise.all([
      db.from("bookings").select("*").gte("date", rangeFrom).lte("date", rangeTo).order("time", { ascending: true }),
      db.from("services").select("id,name,minutes,price,active").order("sort", { ascending: true }),
      db.from("site_settings").select("data").eq("id", 1).maybeSingle(),
      db.from("team").select("*").order("sort", { ascending: true }),
      db.from("time_off").select("member_id,start_date,end_date").eq("active", true),
    ]);
    if (b.error) setMsg({ kind: "error", text: b.error.message });
    else setRows(b.data as Booking[]);
    setSvcs(((s.data ?? []) as (Svc & { active?: boolean })[]).filter((x) => x.active !== false));
    setSettings(mergeSettings(st.data?.data));
    setTeam(((tm.data ?? []) as TeamRow[]).filter((m) => m.takes_bookings !== false));
    // time_off only exists after the staff SQL has been run
    setTimeOff(((to.data ?? []) as { member_id: string; start_date: string; end_date: string }[]).map((t) => ({ memberId: t.member_id, from: t.start_date, to: t.end_date })));
  }, [rangeFrom, rangeTo]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch
    load();
  }, [load]);

  const staff: StaffMember[] = useMemo(
    () =>
      settings
        ? buildStaff(settings, team.map((m) => ({
            id: m.id, name: m.name, role: m.role ?? "", bio: "", photoUrl: m.photo_url ?? "", instagram: "",
            takesBookings: m.takes_bookings !== false, schedule: m.schedule ?? null, serviceIds: m.service_ids ?? [],
          })))
        : [],
    [settings, team],
  );
  const multi = staff.filter((m) => m.takes).length > 1;
  const nameOf = (id: string) => staff.find((m) => m.id === id)?.name ?? "";

  const live = rows.filter((r) => r.status !== "cancelled");
  const visible = filter === "all" ? rows : rows.filter((r) => who(r) === filter);
  const byDate = useMemo(() => {
    const m = new Map<string, Booking[]>();
    for (const r of visible) m.set(r.date, [...(m.get(r.date) ?? []), r]);
    return m;
  }, [visible]);
  const dayRows = (byDate.get(sel) ?? []).slice().sort((a, b) => a.time.localeCompare(b.time));
  const hoursToday = settings?.hours[parseDateKey(sel).getDay()] ?? null;

  /** What each person is doing on a date: working hours, regular day off, or booked-off time. */
  const statusOn = (m: StaffMember, key: string) => {
    if (!settings) return { kind: "work" as const, text: "" };
    if (isOff(m.id, key, timeOff)) return { kind: "off" as const, text: tx("Time off") };
    const w = staffWindow(settings.hours, m.schedule)[parseDateKey(key).getDay()];
    if (!w) return { kind: "rest" as const, text: tx("Day off") };
    return { kind: "work" as const, text: `${formatTime(w[0])} – ${formatTime(w[1])}` };
  };

  const overlapping = (r: Booking) =>
    r.status !== "cancelled" &&
    dayRows.some((o) => o.id !== r.id && who(o) === who(r) && o.status !== "cancelled" && toMinutes(o.time) < endOf(r) && endOf(o) > toMinutes(r.time));

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
  const busyList: Busy[] = live.map((b) => ({ date: b.date, time: b.time, minutes: b.minutes, memberId: who(b) }));

  return (
    <div>
      <h2 className="font-display text-3xl font-light">{tx("Calendar")}</h2>
      <p className="mt-1 max-w-xl text-sm text-muted">{tx("Every appointment at a glance, following each person's schedule and days off. Click a day to see it, add a walk-in or phone booking, or block time off.")}</p>
      {msg && <div className="mt-4"><Notice kind={msg.kind}>{msg.text}</Notice></div>}

      {multi && (
        <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label={tx("Show")}>
          {[{ id: "all", name: tx("Everyone") }, ...staff.filter((m) => m.takes).map((m) => ({ id: m.id, name: m.name }))].map((p) => (
            <button key={p.id} onClick={() => setFilter(p.id)} aria-pressed={filter === p.id} className={`rounded-full border px-4 py-1.5 text-sm transition ${filter === p.id ? "border-accent bg-accent/15 text-accent2" : "border-line text-cream/70 hover:border-cream/40"}`}>{p.name}</button>
          ))}
        </div>
      )}

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
          const shopClosed = settings ? !settings.hours[d.getDay()] : false;
          // who is out this day (booked time off), or - when one person is selected - not scheduled
          const outs = staff.filter((m) => m.takes && (filter === "all" || m.id === filter)).filter((m) => {
            const s = statusOn(m, key);
            return !shopClosed && (s.kind === "off" || (filter !== "all" && s.kind === "rest"));
          });
          return (
            <button
              key={key}
              onClick={() => { setSel(key); setMode("none"); }}
              aria-pressed={sel === key}
              className={`relative min-h-16 bg-ink-2 p-1.5 text-left align-top transition sm:min-h-24 ${inMonth ? "" : "opacity-40"} ${sel === key ? "outline-2 -outline-offset-2 outline-accent" : "hover:bg-ink-3"}`}
            >
              <span className={`inline-grid size-6 place-items-center rounded-full text-xs font-semibold normal-case ${key === today ? "bg-accent text-on-accent" : shopClosed ? "text-muted" : "text-cream"}`}>{d.getDate()}</span>
              <span className="mt-1 hidden space-y-0.5 sm:block">
                {outs.slice(0, 2).map((m) => (
                  <span key={m.id} className="block truncate rounded bg-ink-3 px-1 py-0.5 text-[0.65rem] text-muted normal-case">{filter === "all" ? `${m.name.split(" ")[0]} ${tx("off")}` : tx("Off")}</span>
                ))}
                {list.slice(0, 3 - Math.min(2, outs.length)).map((r) => (
                  <span key={r.id} className={`block truncate rounded px-1 py-0.5 text-[0.65rem] normal-case ${r.service_id === BLOCKED ? "bg-ink-3 text-muted" : pill[r.status]}`}>
                    {formatTime(r.time)} {r.service_id === BLOCKED ? tx("Blocked") : r.name}
                  </span>
                ))}
              </span>
              {(list.length > 0 || outs.length > 0) && (
                <span className="absolute right-1.5 bottom-1.5 flex gap-1 sm:hidden">
                  {outs.length > 0 && <span className="rounded-full bg-ink-3 px-1.5 text-[0.65rem] text-muted">{tx("off")}</span>}
                  {list.length > 0 && <span className="rounded-full bg-accent/25 px-1.5 text-[0.65rem] font-semibold text-accent2">{list.length}</span>}
                </span>
              )}
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
              {hoursToday ? `${tx("Open")} ${formatTime(hoursToday[0])} – ${formatTime(hoursToday[1])}` : tx("Closed this day")}
            </p>
          </div>
          <div className="flex gap-2">
            <Btn small kind="accent" onClick={() => setMode(mode === "add" ? "none" : "add")}>+ Add appointment</Btn>
            <Btn small onClick={() => setMode(mode === "block" ? "none" : "block")}>Block time</Btn>
          </div>
        </div>

        {hoursToday && staff.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2 text-xs">
            {staff.filter((m) => m.takes).map((m) => {
              const s = statusOn(m, sel);
              return (
                <li key={m.id} className={`rounded-full border px-3 py-1.5 ${s.kind === "work" ? "border-counter/50 text-cream" : "border-line text-muted"}`}>
                  <span className="font-medium">{m.name.split(" ")[0]}</span> · {s.text}
                </li>
              );
            })}
          </ul>
        )}

        {mode === "add" && settings && (
          <AddForm key={sel} date={sel} svcs={svcs} settings={settings} staff={staff} timeOff={timeOff} busy={busyList} defaultMember={filter} onDone={afterWrite} onError={fail} />
        )}
        {mode === "block" && settings && (
          <BlockForm key={`b${sel}`} date={sel} settings={settings} staff={staff} timeOff={timeOff} busy={busyList} defaultMember={filter} onDone={afterWrite} onError={fail} />
        )}

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
                      {multi && <p className="text-xs text-accent2">{tx("With")} {nameOf(who(b)) || tx("(removed)")}</p>}
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
        <summary className="cursor-pointer font-medium">{tx("Staff schedules & double-booking protection (one-time setup)")}</summary>
        <p className="mt-3 text-muted">{tx("Run this once in Supabase → SQL Editor. It adds each person's schedule, days off, and makes the database itself refuse overlapping appointments for the same person. Safe to run again.")}</p>
        <pre className="mt-3 max-h-56 overflow-auto rounded-xl border border-line bg-ink p-3 text-xs whitespace-pre-wrap">{STAFF_SQL}</pre>
        <div className="mt-3">
          <Btn small kind="accent" onClick={() => navigator.clipboard.writeText(STAFF_SQL).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); })}>{copied ? "Copied ✓" : "Copy SQL"}</Btn>
        </div>
      </details>
    </div>
  );
}

type FormProps = {
  date: string; settings: SiteSettings; staff: StaffMember[]; timeOff: TimeOff[]; busy: Busy[]; defaultMember: string;
  onDone: (text: string) => void; onError: (e: { code?: string; message: string }) => void;
};

/** Insert a booking row; if the staff SQL has not been run yet, retry without the member column. */
async function insertBooking(row: Record<string, unknown>) {
  const db = browserClient();
  let { error } = await db.from("bookings").insert(row);
  if (error && (error.code === "PGRST204" || error.code === "42703")) {
    const legacy = { ...row };
    delete legacy.member_id;
    ({ error } = await db.from("bookings").insert(legacy));
  }
  return error;
}

function AddForm({ date, svcs, settings, staff, timeOff, busy, defaultMember, onDone, onError }: FormProps & { svcs: Svc[] }) {
  const tx = useTx();
  const dur = useDuration();
  const people = staff.filter((m) => m.takes);
  const [memberId, setMemberId] = useState(people.some((m) => m.id === defaultMember) ? defaultMember : people[0]?.id ?? OWNER_ID);
  const member = people.find((m) => m.id === memberId);
  // only the services this person performs
  const offered = svcs.filter((s) => !member || member.serviceIds.length === 0 || member.serviceIds.includes(s.id));
  const [svcId, setSvcId] = useState(offered[0]?.id ?? "");
  const svc = offered.find((s) => s.id === svcId) ?? offered[0];
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [busyBtn, setBusyBtn] = useState(false);
  const slots = svc
    ? getSlots(date, svc.minutes, { hours: settings.hours, step: settings.slotStepMinutes, leadHours: 0, busy, staff, timeOff, memberId, serviceId: svc.id }).filter((s) => !s.taken)
    : [];
  const chosen = slots.some((s) => s.time === time) ? time : slots[0]?.time ?? "";
  const w = member ? staffWindow(settings.hours, member.schedule)[parseDateKey(date).getDay()] : null;
  const off = isOff(memberId, date, timeOff);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!svc || !chosen || name.trim().length < 2) return;
    setBusyBtn(true);
    const error = await insertBooking({
      ref: `MAN-${crypto.randomUUID().slice(0, 5).toUpperCase()}`,
      service_id: svc.id, service_name: svc.name, addon_ids: [], date, time: chosen, minutes: svc.minutes,
      total: svc.price, deposit: 0, name: name.trim(), email: "", phone: phone.trim(), first_visit: false,
      notes: notes.trim(), status: "confirmed", member_id: memberId,
    });
    setBusyBtn(false);
    if (error) return onError(error);
    onDone(tx("Appointment added."));
  };

  return (
    <form onSubmit={submit} className="mt-5 grid gap-4 rounded-xl border border-accent/40 bg-ink p-4 sm:grid-cols-2">
      {people.length > 1 && (
        <Field label="With">
          <select className={inputCls} value={memberId} onChange={(e) => setMemberId(e.target.value)}>
            {people.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </Field>
      )}
      <Field label="Service">
        <select className={inputCls} value={svc?.id ?? ""} onChange={(e) => setSvcId(e.target.value)}>
          {offered.map((s) => <option key={s.id} value={s.id}>{s.name} · {dur(s.minutes)}</option>)}
        </select>
      </Field>
      <Field label="Time" className={people.length > 1 ? "" : "sm:col-span-1"}>
        {slots.length ? (
          <select className={inputCls} value={chosen} onChange={(e) => setTime(e.target.value)}>
            {slots.map((s) => <option key={s.time} value={s.time}>{formatTime(s.time)} – {formatTime(s.endsAt)}</option>)}
          </select>
        ) : (
          <p className="rounded-xl border border-line px-3.5 py-2.5 text-sm text-muted">
            {off ? tx("{name} is off this day.", { name: member?.name ?? "" }) : !w ? tx("{name} isn't scheduled this day.", { name: member?.name ?? "" }) : tx("No open times for that service on this day.")}
          </p>
        )}
      </Field>
      <Field label="Client name"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required /></Field>
      <Field label="Phone"><input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" /></Field>
      <Field label="Notes" className="sm:col-span-2"><input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
      <div className="sm:col-span-2"><Btn type="submit" kind="accent" disabled={busyBtn || !chosen || !svc}>{busyBtn ? "Saving…" : "Save appointment"}</Btn></div>
    </form>
  );
}

function BlockForm({ date, settings, staff, busy, defaultMember, onDone, onError }: FormProps) {
  const tx = useTx();
  const people = staff.filter((m) => m.takes);
  const [target, setTarget] = useState(people.some((m) => m.id === defaultMember) ? defaultMember : people.length > 1 ? "all" : people[0]?.id ?? OWNER_ID);
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
  const targets = target === "all" ? people.map((m) => m.id) : [target];
  const clash = busy.some((b) => targets.includes(b.memberId || OWNER_ID) && b.date === date && toMinutes(b.time) < toMinutes(startAt) + minutes && endOf(b) > toMinutes(startAt));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyBtn(true);
    for (const id of targets) {
      const error = await insertBooking({
        ref: `BLK-${crypto.randomUUID().slice(0, 5).toUpperCase()}`,
        service_id: BLOCKED, service_name: "Blocked", addon_ids: [], date, time: startAt, minutes,
        total: 0, deposit: 0, name: reason.trim() || tx("Time off"), email: "", phone: "", first_visit: false, notes: "", status: "confirmed", member_id: id,
      });
      if (error) { setBusyBtn(false); return onError(error); }
    }
    setBusyBtn(false);
    onDone(tx("Time blocked."));
  };

  return (
    <form onSubmit={submit} className="mt-5 grid gap-4 rounded-xl border border-line bg-ink p-4 sm:grid-cols-2 lg:grid-cols-4">
      {people.length > 1 && (
        <Field label="Who">
          <select className={inputCls} value={target} onChange={(e) => setTarget(e.target.value)}>
            <option value="all">{tx("Everyone")}</option>
            {people.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </Field>
      )}
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
      {clash && <div className="sm:col-span-2 lg:col-span-4"><Notice kind="error">That time overlaps another appointment.</Notice></div>}
      <div className="sm:col-span-2 lg:col-span-4"><Btn type="submit" kind="accent" disabled={busyBtn || clash}>{busyBtn ? "Saving…" : "Block this time"}</Btn></div>
    </form>
  );
}
