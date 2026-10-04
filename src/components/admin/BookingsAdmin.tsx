"use client";
import { useCallback, useEffect, useState } from "react";
import { browserClient } from "@/lib/supabase";
import { revalidateSite } from "@/app/actions";
import { formatTime, parseDateKey } from "@/lib/availability";
import { useTx, useLocale, useDuration, intlTag } from "@/lib/locale";
import { Btn, Notice } from "./ui";

type Booking = {
  id: string; ref: string; service_name: string; addon_ids: string[]; date: string; time: string; minutes: number;
  total: number; deposit: number; name: string; email: string; phone: string; first_visit: boolean; notes: string;
  status: "pending" | "confirmed" | "cancelled" | "completed"; created_at: string;
};

const filters = ["Upcoming", "Pending", "All", "Cancelled"] as const;
const badge: Record<Booking["status"], string> = {
  pending: "bg-accent/20 text-accent2",
  confirmed: "bg-counter/20 text-counter",
  completed: "bg-ink-3 text-muted",
  cancelled: "bg-[#d9534f]/15 text-[#c0443f]",
};

export default function BookingsAdmin() {
  const tx = useTx();
  const dur = useDuration();
  const tag = intlTag(useLocale());
  const [rows, setRows] = useState<Booking[] | null>(null);
  const [filter, setFilter] = useState<(typeof filters)[number]>("Upcoming");
  const [err, setErr] = useState("");
  const [today] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; });

  const load = useCallback(async () => {
    const { data, error } = await browserClient().from("bookings").select("*").order("date", { ascending: false }).order("time", { ascending: false });
    if (error) setErr(error.message);
    else setRows(data as Booking[]);
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch
    load();
  }, [load]);

  const setStatus = async (b: Booking, status: Booking["status"]) => {
    const { error } = await browserClient().from("bookings").update({ status }).eq("id", b.id);
    if (error) return setErr(error.message);
    await revalidateSite(); // freed-up slots reopen on the public site
    load();
  };
  const del = async (b: Booking) => {
    if (!window.confirm(tx("Permanently delete {name}'s booking?", { name: b.name }))) return;
    const { error } = await browserClient().from("bookings").delete().eq("id", b.id);
    if (error) return setErr(error.message);
    await revalidateSite();
    load();
  };

  const shown = (rows ?? []).filter((b) =>
    filter === "All" ? true : filter === "Pending" ? b.status === "pending" : filter === "Cancelled" ? b.status === "cancelled" : b.date >= today && b.status !== "cancelled",
  ).sort((a, b) => (filter === "Upcoming" ? (a.date + a.time).localeCompare(b.date + b.time) : (b.date + b.time).localeCompare(a.date + a.time)));

  return (
    <div>
      <h2 className="font-display text-3xl font-light">{tx("Bookings")}</h2>
      <p className="mt-1 text-sm text-muted">{tx("New requests arrive as “pending”. Confirm them, or cancel to free the time slot again.")}</p>
      <div className="my-5 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f} className={`rounded-full border px-4 py-1.5 text-sm ${filter === f ? "border-accent bg-accent/15 text-accent2" : "border-line text-cream/70"}`}>
            {tx(f)}
            {f === "Pending" && rows ? ` (${rows.filter((b) => b.status === "pending").length})` : ""}
          </button>
        ))}
        <Btn small onClick={load}>Refresh</Btn>
      </div>
      {err && <Notice kind="error">{err}</Notice>}
      {!rows ? <p className="text-muted">{tx("Loading…")}</p> : shown.length === 0 ? <Notice kind="info">No bookings in this view.</Notice> : (
        <ul className="space-y-3">
          {shown.map((b) => (
            <li key={b.id} className="rounded-2xl border border-line bg-ink-2 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-xl">{parseDateKey(b.date).toLocaleDateString(tag, { weekday: "short", month: "short", day: "numeric" })} · {formatTime(b.time)}</p>
                  <p className="text-sm text-muted">{b.service_name} · {dur(b.minutes)} · {tx("est.")} ${Number(b.total)}{Number(b.deposit) ? ` · ${tx("deposit")} $${Number(b.deposit)}` : ""}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs uppercase ${badge[b.status]}`}>{tx(b.status)}</span>
              </div>
              <div className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
                <p><span className="text-muted">{tx("Client:")}</span> {b.name}{b.first_visit ? ` ${tx("(first visit)")}` : ""}</p>
                <p><span className="text-muted">{tx("Phone:")}</span> <a className="text-accent2 hover:underline" href={`tel:${b.phone}`}>{b.phone}</a></p>
                <p><span className="text-muted">{tx("Email:")}</span> <a className="text-accent2 hover:underline" href={`mailto:${b.email}`}>{b.email}</a></p>
                <p><span className="text-muted">{tx("Ref:")}</span> <span className="font-mono">{b.ref}</span></p>
              </div>
              {b.notes && <p className="mt-3 rounded-xl bg-ink-3/60 p-3 text-sm">{b.notes}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                {b.status === "pending" && <Btn small kind="accent" onClick={() => setStatus(b, "confirmed")}>Confirm</Btn>}
                {b.status === "confirmed" && <Btn small onClick={() => setStatus(b, "completed")}>Mark completed</Btn>}
                {b.status !== "cancelled" && <Btn small onClick={() => setStatus(b, "cancelled")}>Cancel</Btn>}
                {b.status === "cancelled" && <Btn small onClick={() => setStatus(b, "pending")}>Restore</Btn>}
                <Btn small kind="danger" onClick={() => del(b)}>Delete</Btn>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
