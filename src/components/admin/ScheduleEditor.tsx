"use client";
import { useTx, useLocale, intlTag } from "@/lib/locale";
import type { Hours } from "@/lib/site";
import { inputCls } from "./ui";

/** Weekly working hours keyed by weekday number ("0" = Sunday … "6" = Saturday); null day = day off. */
export type Sched = Record<string, [string, string] | null>;
const DAYS = [1, 2, 3, 4, 5, 6, 0];

/**
 * value = null means "same as the shop hours". Otherwise it is this person's own week:
 * clients can only book them on the days and hours ticked here (never outside the shop hours).
 */
export default function ScheduleEditor({ value, shop, onChange }: { value: Sched | null; shop: Hours | null; onChange: (v: Sched | null) => void }) {
  const tx = useTx();
  const tag = intlTag(useLocale());
  const dayName = (d: number) => new Date(2024, 0, 7 + d).toLocaleDateString(tag, { weekday: "long" });
  const startFromShop = (): Sched => Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map((d) => [String(d), shop?.[d] ?? null]));
  const set = (d: number, v: [string, string] | null) => onChange({ ...(value ?? startFromShop()), [String(d)]: v });

  return (
    <div className="rounded-xl border border-line p-3 sm:p-4">
      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" className="size-4 accent-[var(--accent)]" checked={value === null} onChange={(e) => onChange(e.target.checked ? null : startFromShop())} />
        {tx("Works the regular opening hours")}
      </label>
      {value !== null && (
        <ul className="mt-3 divide-y divide-line">
          {DAYS.map((d) => {
            const h = value[String(d)] ?? null;
            const shopDay = shop?.[d] ?? null;
            return (
              <li key={d} className="flex flex-wrap items-center gap-3 py-2.5">
                <span className="w-28 text-sm font-medium capitalize">{dayName(d)}</span>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-4 accent-[var(--accent)]"
                    checked={!!h}
                    onChange={(e) => set(d, e.target.checked ? [shopDay?.[0] ?? "09:00", shopDay?.[1] ?? "17:00"] : null)}
                  />
                  {tx("Works")}
                </label>
                {h ? (
                  <span className="flex items-center gap-2">
                    <input aria-label={`${dayName(d)} ${tx("opens")}`} type="time" className={`${inputCls} w-auto`} value={h[0]} onChange={(e) => set(d, [e.target.value, h[1]])} />
                    <span className="text-muted">{tx("to")}</span>
                    <input aria-label={`${dayName(d)} ${tx("closes")}`} type="time" className={`${inputCls} w-auto`} value={h[1]} onChange={(e) => set(d, [h[0], e.target.value])} />
                  </span>
                ) : (
                  <span className="text-sm text-muted">{tx("Day off")}</span>
                )}
                {h && !shopDay && <span className="text-xs text-[#c0443f]">{tx("Closed that day, so nobody can book it.")}</span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
