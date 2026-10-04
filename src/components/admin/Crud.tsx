"use client";
import { useCallback, useEffect, useState } from "react";
import { browserClient } from "@/lib/supabase";
import { revalidateSite } from "@/app/actions";
import { Btn, Field, ImageField, inputCls, Notice } from "./ui";

export type Es = Record<string, string>;
export type Row = Record<string, string | number | boolean | string[] | Es | null>;
export type FieldDef = {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "image" | "palette" | "bool";
  options?: string[];
  hint?: string;
  wide?: boolean;
  /** Also show a Spanish input for this field (saved in the row's `es` column). */
  tr?: boolean;
};

type Props = {
  table: string;
  title: string;
  blurb: string;
  fields: FieldDef[];
  /** "slug" tables use readable text ids (services); "uuid" tables get a generated id. */
  idMode: "slug" | "uuid";
  titleKey: string;
  subtitle?: (r: Row) => string;
  blank: Row;
  /** Shown (with a copy button) when the table has not been created in Supabase yet. */
  setupSql?: string;
};

export const ES_SQL = `alter table public.services add column if not exists es jsonb not null default '{}'::jsonb;
alter table public.addons   add column if not exists es jsonb not null default '{}'::jsonb;
alter table public.looks    add column if not exists es jsonb not null default '{}'::jsonb;
alter table public.reviews  add column if not exists es jsonb not null default '{}'::jsonb;
alter table public.faqs     add column if not exists es jsonb not null default '{}'::jsonb;
alter table public.team     add column if not exists es jsonb not null default '{}'::jsonb;
notify pgrst, 'reload schema';`;

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "item";

export default function Crud({ table, title, blurb, fields, idMode, titleKey, subtitle, blank, setupSql }: Props) {
  const db = browserClient();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState<{ kind: "error" | "ok"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [missing, setMissing] = useState(false);
  const [needEs, setNeedEs] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await browserClient().from(table).select("*").order("sort", { ascending: true });
    if (error?.code === "PGRST205" || error?.code === "42P01") setMissing(true);
    else if (error) setMsg({ kind: "error", text: error.message });
    else setRows(data as Row[]);
  }, [table]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch
    load();
  }, [load]);

  const patch = (id: string, p: Row) => setRows((rs) => rs!.map((r) => (r.id === id ? { ...r, ...p } : r)));

  const add = () => {
    const id = idMode === "uuid" ? crypto.randomUUID() : `new-${Math.random().toString(36).slice(2, 7)}`;
    const sort = Math.max(0, ...(rows ?? []).map((r) => Number(r.sort) || 0)) + 1;
    setRows((rs) => [{ ...blank, id, sort, ...("seed" in blank ? { seed: Math.floor(Math.random() * 900) + 10 } : {}) }, ...(rs ?? [])]);
    setFresh((f) => new Set(f).add(id));
    setOpen(id);
  };

  const save = async (row: Row) => {
    setBusy(true);
    setMsg(null);
    const isNew = fresh.has(row.id as string);
    const out: Row = { ...row };
    if (isNew && idMode === "slug") {
      const base = slugify(String(row[titleKey] ?? ""));
      const taken = new Set((rows ?? []).filter((r) => !fresh.has(r.id as string)).map((r) => r.id));
      out.id = taken.has(base) ? `${base}-${crypto.randomUUID().slice(0, 3)}` : base;
    }
    for (const f of fields) if (f.type === "image" && !out[f.key]) out[f.key] = null;
    const { error } = await db.from(table).upsert(out);
    setBusy(false);
    if (error?.code === "PGRST204" && /\bes\b/.test(error.message)) return setNeedEs(true);
    if (error) return setMsg({ kind: "error", text: error.message });
    setFresh((f) => { const n = new Set(f); n.delete(row.id as string); return n; });
    setOpen(null);
    setMsg({ kind: "ok", text: "Saved. Your website is updated." });
    await revalidateSite();
    await load();
  };

  const remove = async (row: Row) => {
    if (!window.confirm(`Delete “${row[titleKey]}”? This can't be undone.`)) return;
    if (fresh.has(row.id as string)) return setRows((rs) => rs!.filter((r) => r.id !== row.id));
    setBusy(true);
    const { error } = await db.from(table).delete().eq("id", row.id as string);
    setBusy(false);
    if (error) return setMsg({ kind: "error", text: error.message });
    setMsg({ kind: "ok", text: "Deleted." });
    await revalidateSite();
    await load();
  };

  const move = async (i: number, dir: -1 | 1) => {
    const list = rows!;
    const a = list[i], b = list[i + dir];
    if (!b || fresh.has(a.id as string) || fresh.has(b.id as string)) return;
    const { error } = await db.from(table).upsert([{ ...a, sort: b.sort }, { ...b, sort: a.sort }]);
    if (error) return setMsg({ kind: "error", text: error.message });
    await revalidateSite();
    await load();
  };

  if (needEs) {
    return (
      <div className="space-y-4">
        <h2 className="font-display text-3xl font-light">{title}</h2>
        <Notice kind="info">
          Spanish support needs a one-time database update. Open Supabase → <b>SQL Editor</b> → New query, paste the SQL below, press <b>Run</b>, then reload this page and save again.
        </Notice>
        <pre className="max-h-72 overflow-auto rounded-2xl border border-line bg-ink-2 p-4 text-xs leading-relaxed whitespace-pre-wrap">{ES_SQL}</pre>
        <Btn kind="accent" onClick={() => navigator.clipboard.writeText(ES_SQL)}>Copy SQL</Btn>
      </div>
    );
  }

  if (missing) {
    return (
      <div className="space-y-4">
        <h2 className="font-display text-3xl font-light">{title}</h2>
        <Notice kind="info">
          This section needs a one-time database update. Open Supabase → <b>SQL Editor</b> → New query, paste the SQL below, press <b>Run</b>, then reload this page.
        </Notice>
        {setupSql && (
          <>
            <pre className="max-h-72 overflow-auto rounded-2xl border border-line bg-ink-2 p-4 text-xs leading-relaxed whitespace-pre-wrap">{setupSql}</pre>
            <Btn kind="accent" onClick={() => { navigator.clipboard.writeText(setupSql).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); }); }}>
              {copied ? "Copied ✓" : "Copy SQL"}
            </Btn>
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-light">{title}</h2>
          <p className="mt-1 max-w-xl text-sm text-muted">{blurb}</p>
        </div>
        <Btn kind="accent" onClick={add}>+ Add new</Btn>
      </div>
      {msg && <div className="mb-4"><Notice kind={msg.kind}>{msg.text}</Notice></div>}
      {!rows ? (
        <p className="text-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <Notice kind="info">Nothing here yet. Click “Add new”.</Notice>
      ) : (
        <ul className="space-y-3">
          {rows.map((row, i) => {
            const id = row.id as string;
            const isOpen = open === id;
            return (
              <li key={id} className={`rounded-2xl border bg-ink-2 ${isOpen ? "border-accent" : "border-line"} ${row.active === false ? "opacity-60" : ""}`}>
                <div className="flex items-center gap-2 p-3">
                  <div className="flex flex-col">
                    <button aria-label="Move up" onClick={() => move(i, -1)} disabled={i === 0} className="px-2 text-xs text-muted hover:text-cream disabled:opacity-20">▲</button>
                    <button aria-label="Move down" onClick={() => move(i, 1)} disabled={i === rows.length - 1} className="px-2 text-xs text-muted hover:text-cream disabled:opacity-20">▼</button>
                  </div>
                  <button className="flex-1 py-1 text-left" onClick={() => setOpen(isOpen ? null : id)} aria-expanded={isOpen}>
                    <span className="font-medium">{String(row[titleKey] || "Untitled")}</span>
                    {row.active === false && <span className="ml-2 rounded-full bg-ink-3 px-2 py-0.5 text-[0.65rem] text-muted uppercase">Hidden</span>}
                    {subtitle && <span className="block text-xs text-muted">{subtitle(row)}</span>}
                  </button>
                  <Btn small onClick={() => setOpen(isOpen ? null : id)}>{isOpen ? "Close" : "Edit"}</Btn>
                </div>
                {isOpen && (
                  <form
                    onSubmit={(e) => { e.preventDefault(); save(row); }}
                    className="grid gap-4 border-t border-line p-4 sm:grid-cols-2"
                  >
                    {fields.map((f) => {
                      const v = row[f.key];
                      const span = f.wide || f.type === "textarea" || f.type === "image" || f.type === "palette" ? "sm:col-span-2" : "";
                      if (f.type === "image") return <div key={f.key} className={span}><ImageField label={f.label} value={(v as string) || null} onChange={(u) => patch(id, { [f.key]: u })} /></div>;
                      if (f.type === "bool")
                        return (
                          <label key={f.key} className={`flex items-center gap-3 text-sm ${span}`}>
                            <input type="checkbox" className="size-4 accent-[var(--accent)]" checked={v === true} onChange={(e) => patch(id, { [f.key]: e.target.checked })} />
                            {f.label}
                            {f.hint && <span className="text-xs text-muted">({f.hint})</span>}
                          </label>
                        );
                      if (f.type === "palette") {
                        const pal = (Array.isArray(v) ? v : ["#3a2418", "#b98a5e", "#f1dcc0"]) as string[];
                        return (
                          <Field key={f.key} label={f.label} hint={f.hint} className={span}>
                            <div className="flex gap-3">
                              {[0, 1, 2].map((n) => (
                                <input key={n} type="color" aria-label={`Color ${n + 1}`} value={pal[n] ?? "#000000"} onChange={(e) => { const p = [...pal]; p[n] = e.target.value; patch(id, { [f.key]: p }); }} className="h-10 w-14 cursor-pointer rounded-lg border border-line bg-transparent" />
                              ))}
                            </div>
                          </Field>
                        );
                      }
                      const esVal = ((row.es as Es | undefined) ?? {})[f.key] ?? "";
                      const setEs = (val: string) => patch(id, { es: { ...((row.es as Es | undefined) ?? {}), [f.key]: val } });
                      return (
                        <Field key={f.key} label={f.label} hint={f.hint} className={span}>
                          {f.type === "textarea" ? (
                            <textarea className={`${inputCls} min-h-24`} value={String(v ?? "")} onChange={(e) => patch(id, { [f.key]: e.target.value })} />
                          ) : f.type === "select" ? (
                            <select className={inputCls} value={String(v ?? "")} onChange={(e) => patch(id, { [f.key]: e.target.value })}>
                              {f.options!.map((o) => <option key={o} value={o}>{o}</option>)}
                            </select>
                          ) : f.type === "number" ? (
                            <input className={inputCls} type="number" min={0} step="any" value={String(v ?? 0)} onChange={(e) => patch(id, { [f.key]: Number(e.target.value) })} />
                          ) : (
                            <input className={inputCls} value={String(v ?? "")} onChange={(e) => patch(id, { [f.key]: e.target.value })} />
                          )}
                          {f.tr && (f.type === "text" || f.type === "textarea") && (
                            <span className="mt-2 block">
                              <span className="mb-1 block text-[0.62rem] tracking-[0.2em] text-accent uppercase">Español</span>
                              {f.type === "textarea" ? (
                                <textarea className={`${inputCls} min-h-20`} value={esVal} onChange={(e) => setEs(e.target.value)} placeholder="Traducción al español (opcional)" />
                              ) : (
                                <input className={inputCls} value={esVal} onChange={(e) => setEs(e.target.value)} placeholder="Traducción al español (opcional)" />
                              )}
                            </span>
                          )}
                        </Field>
                      );
                    })}
                    <label className="flex items-center gap-3 text-sm sm:col-span-2">
                      <input type="checkbox" className="size-4 accent-[var(--accent)]" checked={row.active !== false} onChange={(e) => patch(id, { active: e.target.checked })} />
                      Show on website
                    </label>
                    <div className="flex flex-wrap gap-3 sm:col-span-2">
                      <Btn type="submit" kind="accent" disabled={busy}>{busy ? "Saving…" : "Save changes"}</Btn>
                      <Btn kind="danger" onClick={() => remove(row)} disabled={busy}>Delete</Btn>
                    </div>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
