"use client";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { browserClient, hasSupabase } from "@/lib/supabase";
import { revalidateSite } from "@/app/actions";
import { addons, categories, faqs, lookCategories, looks, reviews, services } from "@/lib/data";
import { addonsEs, faqsEs, looksEs, reviewsEs, servicesEs } from "@/lib/data-es";
import { defaultSettings, mergeSettings } from "@/lib/site";
import { Btn, Field, inputCls, Notice } from "./ui";
import Crud, { ES_SQL, type FieldDef } from "./Crud";
import BookingsAdmin from "./BookingsAdmin";
import CalendarAdmin from "./CalendarAdmin";
import SettingsAdmin from "./SettingsAdmin";
import ThemeToggle from "../ThemeToggle";
import LangToggle from "../LangToggle";
import { useTx } from "@/lib/locale";

type Gate = "loading" | "signed-out" | "checking" | "owner" | "unclaimed" | "denied" | "no-schema";
const tabs = [
  ["bookings", "Bookings"],
  ["calendar", "Calendar"],
  ["services", "Services"],
  ["addons", "Add-ons"],
  ["looks", "Portfolio"],
  ["products", "Products"],
  ["reviews", "Reviews"],
  ["faqs", "FAQ"],
  ["profile", "Stylist profile"],
  ["team", "Team"],
  ["text", "Page text"],
  ["settings", "Salon & contact"],
] as const;
type Tab = (typeof tabs)[number][0];

const serviceFields: FieldDef[] = [
  { key: "name", label: "Service name", type: "text", tr: true },
  { key: "category", label: "Category", type: "select", options: [...categories] },
  { key: "blurb", label: "Description", type: "textarea", tr: true },
  { key: "price", label: "Starting price ($)", type: "number" },
  { key: "minutes", label: "Duration (minutes)", type: "number" },
  { key: "deposit", label: "Deposit ($)", type: "number", hint: "0 = no deposit" },
];
const addonFields: FieldDef[] = [
  { key: "name", label: "Name", type: "text", tr: true },
  { key: "blurb", label: "Short description", type: "text", tr: true },
  { key: "price", label: "Price ($)", type: "number" },
  { key: "minutes", label: "Adds (minutes)", type: "number" },
];
const lookFields: FieldDef[] = [
  { key: "image_url", label: "After photo (main image)", type: "image" },
  { key: "before_url", label: "Before photo (optional, enables the slider)", type: "image" },
  { key: "title", label: "Title", type: "text", tr: true },
  { key: "category", label: "Category", type: "select", options: lookCategories.filter((c) => c !== "All") },
  { key: "service_id", label: "Service for this look", type: "service", hint: "The “Book this look” button on the portfolio preselects this service." },
  { key: "story", label: "Story", type: "textarea", tr: true },
  { key: "hours", label: "Time in chair (label)", type: "text", hint: "e.g. 3.5 hrs", tr: true },
  { key: "kind", label: "Placeholder art style", type: "select", options: ["straight", "wave", "curl", "bob"], hint: "Only used when no photo is uploaded." },
  { key: "palette", label: "Palette (placeholder art)", type: "palette" },
];
const TEAM_SQL = `create table if not exists public.team (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null default '',
  bio text not null default '',
  photo_url text,
  instagram text not null default '',
  es jsonb not null default '{}'::jsonb,
  sort int not null default 0,
  active boolean not null default true
);
alter table public.team enable row level security;
drop policy if exists "public read" on public.team;
create policy "public read" on public.team for select to anon, authenticated using (active or public.is_admin());
drop policy if exists "admin write" on public.team;
create policy "admin write" on public.team for all to authenticated using (public.is_admin()) with check (public.is_admin());`;

const PRODUCTS_SQL = `create table if not exists public.products (
  id text primary key,
  name text not null,
  category text not null default 'Hair care',
  blurb text not null default '',
  price numeric not null default 0,
  image_url text,
  link text not null default '',
  in_stock boolean not null default true,
  sort int not null default 0,
  active boolean not null default true,
  es jsonb not null default '{}'::jsonb
);
alter table public.products enable row level security;
drop policy if exists "public read" on public.products;
create policy "public read" on public.products for select to anon, authenticated using (active or public.is_admin());
drop policy if exists "admin write" on public.products;
create policy "admin write" on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());
notify pgrst, 'reload schema';`;

const productFields: FieldDef[] = [
  { key: "image_url", label: "Photo", type: "image" },
  { key: "name", label: "Product name", type: "text", tr: true },
  { key: "category", label: "Category", type: "select", options: ["Eyelash extensions", "Hair care", "Shampoo & conditioner", "Styling", "Treatments", "Tools", "Other"] },
  { key: "blurb", label: "Short description", type: "textarea", tr: true },
  { key: "price", label: "Price ($)", type: "number", hint: "0 = don't show a price" },
  { key: "link", label: "Online buy link (optional)", type: "text", hint: "If set, shows a “Buy online” button." },
  { key: "in_stock", label: "In stock", type: "bool" },
];

const teamFields: FieldDef[] = [
  { key: "photo_url", label: "Photo", type: "image" },
  { key: "name", label: "Name", type: "text" },
  { key: "role", label: "Role", type: "text", hint: "e.g. Color specialist", tr: true },
  { key: "bio", label: "Short bio", type: "textarea", tr: true },
  { key: "instagram", label: "Instagram handle", type: "text", hint: "without the @" },
];
const reviewFields: FieldDef[] = [
  { key: "name", label: "Client name", type: "text" },
  { key: "service", label: "Service they had", type: "text", tr: true },
  { key: "quote", label: "Review", type: "textarea", tr: true },
  { key: "stars", label: "Stars (1–5)", type: "number" },
];
const faqFields: FieldDef[] = [
  { key: "q", label: "Question", type: "text", wide: true, tr: true },
  { key: "a", label: "Answer", type: "textarea", tr: true },
];

function Login() {
  const tx = useTx();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const { error } = await browserClient().auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) setErr(error.message === "Invalid login credentials" ? "That email or password is incorrect." : error.message);
  };
  return (
    <form onSubmit={submit} className="glass mx-auto mt-24 w-full max-w-sm space-y-5 rounded-3xl p-8">
      <div>
        <p className="text-xs tracking-[0.3em] text-accent uppercase">{tx("Owner login")}</p>
        <h1 className="font-display mt-2 text-4xl font-light">{tx("Welcome back")}</h1>
      </div>
      <Field label="Email"><input className={inputCls} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
      <Field label="Password"><input className={inputCls} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></Field>
      {err && <Notice kind="error">{err}</Notice>}
      <Btn type="submit" kind="accent" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Btn>
    </form>
  );
}

export default function AdminApp() {
  const tx = useTx();
  const [gate, setGate] = useState<Gate>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [tab, setTab] = useState<Tab>("bookings");
  const [seeded, setSeeded] = useState(true);
  const [esState, setEsState] = useState<"ok" | "needsSql" | "needsText">("ok");
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const check = async () => {
    const db = browserClient();
    const { data, error } = await db.rpc("is_admin");
    if (error) return setGate("no-schema");
    if (data === true) {
      const st = await db.from("site_settings").select("data").eq("id", 1).maybeSingle();
      const isSeeded = mergeSettings(st.data?.data).seeded;
      setSeeded(isSeeded);
      if (isSeeded) {
        // Spanish support: is the `es` column there, and has the starter content been translated?
        const probe = await db.from("services").select("es").limit(1);
        if (probe.error) setEsState("needsSql");
        else if (probe.data?.[0] && Object.keys((probe.data[0].es as object) ?? {}).length === 0) setEsState("needsText");
        else setEsState("ok");
      }
      return setGate("owner");
    }
    // Signed in but not an owner. If nobody owns the site yet, claim_admin() will succeed.
    setGate("unclaimed");
  };

  useEffect(() => {
    if (!hasSupabase) return;
    const { data } = browserClient().auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (!s) return setGate("signed-out");
      setGate("checking");
      check();
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const claim = async () => {
    const { data, error } = await browserClient().rpc("claim_admin");
    if (error) return setNote({ kind: "error", text: error.message });
    if (data === true) check();
    else setGate("denied");
  };

  const seedSpanish = async () => {
    const db = browserClient();
    const jobs = [
      ...Object.entries(servicesEs).map(([id, es]) => db.from("services").update({ es }).eq("id", id)),
      ...Object.entries(addonsEs).map(([id, es]) => db.from("addons").update({ es }).eq("id", id)),
      ...Object.entries(looksEs).map(([id, es]) => db.from("looks").update({ es }).eq("id", id)),
    ];
    const rv = await db.from("reviews").select("id").order("sort", { ascending: true });
    (rv.data ?? []).forEach((r, i) => reviewsEs[i] && jobs.push(db.from("reviews").update({ es: reviewsEs[i] }).eq("id", r.id)));
    const fq = await db.from("faqs").select("id").order("sort", { ascending: true });
    (fq.data ?? []).forEach((f, i) => faqsEs[i] && jobs.push(db.from("faqs").update({ es: faqsEs[i] }).eq("id", f.id)));
    const results = await Promise.all(jobs);
    const bad = results.find((r) => r.error);
    if (bad?.error) return setNote({ kind: "error", text: bad.error.message });
    setEsState("ok");
    setNote({ kind: "ok", text: "Spanish added to the starter content. Review it in each section (look for the “Español” boxes)." });
    await revalidateSite();
  };

  const seed = async () => {
    if (!window.confirm(tx("Load the starter services, portfolio, reviews and FAQ into your database? You can edit or delete everything afterwards."))) return;
    const db = browserClient();
    const results = await Promise.all([
      db.from("services").upsert(services.map((s, i) => ({ id: s.id, name: s.name, category: s.category, blurb: s.blurb, price: s.price, minutes: s.minutes, deposit: s.deposit, es: servicesEs[s.id] ?? {}, sort: i + 1, active: true }))),
      db.from("addons").upsert(addons.map((a, i) => ({ ...a, es: addonsEs[a.id] ?? {}, sort: i + 1, active: true }))),
      db.from("looks").upsert(looks.map((l, i) => ({ id: l.id, title: l.title, category: l.category, kind: l.kind, palette: l.palette, service_id: l.serviceId, story: l.story, hours: l.hours, seed: l.seed, image_url: null, before_url: null, es: looksEs[l.id] ?? {}, sort: i + 1, active: true }))),
      db.from("reviews").insert(reviews.map((r, i) => ({ ...r, es: reviewsEs[i] ?? {}, sort: i + 1, active: true }))),
      db.from("faqs").insert(faqs.map((f, i) => ({ ...f, es: faqsEs[i] ?? {}, sort: i + 1, active: true }))),
    ]);
    const bad = results.find((r) => r.error);
    if (bad?.error) return setNote({ kind: "error", text: bad.error.message });
    const cur = await db.from("site_settings").select("data").eq("id", 1).maybeSingle();
    const { error } = await db.from("site_settings").upsert({ id: 1, data: { ...defaultSettings, ...mergeSettings(cur.data?.data), seeded: true } });
    if (error) return setNote({ kind: "error", text: error.message });
    setSeeded(true);
    setNote({ kind: "ok", text: "Starter content loaded. Edit anything from the tabs." });
    await revalidateSite();
  };

  if (!hasSupabase) return <Shell><Notice kind="error">Supabase isn’t configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local.</Notice></Shell>;
  if (gate === "loading" || gate === "checking") return <Shell><p className="mt-24 text-center text-muted">{tx("Loading…")}</p></Shell>;
  if (gate === "signed-out") return <Shell><Login /></Shell>;
  if (gate === "no-schema")
    return (
      <Shell session={session}>
        <div className="mx-auto mt-16 max-w-xl space-y-4">
          <h1 className="font-display text-4xl font-light">{tx("One-time database setup")}</h1>
          <Notice kind="info">Open your Supabase project → SQL Editor → New query, paste the contents of supabase/schema.sql from this project, and press Run. Then reload this page.</Notice>
        </div>
      </Shell>
    );
  if (gate === "unclaimed" || gate === "denied")
    return (
      <Shell session={session}>
        <div className="mx-auto mt-16 max-w-xl space-y-4">
          <h1 className="font-display text-4xl font-light">{gate === "denied" ? tx("Not authorized") : tx("Claim this website")}</h1>
          {gate === "denied" ? (
            <Notice kind="error">This account isn’t the owner of this site. Sign out and use the owner login.</Notice>
          ) : (
            <>
              <p className="text-cream/75">{tx("No owner has been set up yet. If you’re the salon owner, claim the dashboard now. This can only be done once.")}</p>
              {note && <Notice kind={note.kind}>{note.text}</Notice>}
              <Btn kind="accent" onClick={claim}>I’m the owner. Claim it</Btn>
            </>
          )}
        </div>
      </Shell>
    );

  return (
    <Shell session={session}>
      <div className="mt-8 grid gap-8 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <nav aria-label={tx("Dashboard sections")} className="scroll-hide flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {tabs.map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} aria-current={tab === id} className={`shrink-0 rounded-xl px-4 py-2.5 text-left text-sm transition ${tab === id ? "bg-accent/15 font-semibold text-accent2" : "text-cream/75 hover:bg-ink-3"}`}>
              {tx(label)}
            </button>
          ))}
        </nav>
        <div className="min-w-0 pb-24">
          {!seeded && (
            <div className="mb-6 space-y-3 rounded-2xl border border-accent/50 bg-accent/10 p-5">
              <p className="font-medium">{tx("Your website is showing sample content.")}</p>
              <p className="text-sm text-cream/75">{tx("Load the starter services, portfolio, reviews and FAQ into your database so you can edit them here.")}</p>
              <Btn kind="accent" onClick={seed}>Load starter content</Btn>
            </div>
          )}
          {seeded && esState === "needsSql" && (
            <div className="mb-6 space-y-3 rounded-2xl border border-accent/50 bg-accent/10 p-5">
              <p className="font-medium">{tx("Turn on Spanish for your content")}</p>
              <p className="text-sm text-cream/75">{tx("One-time step: open Supabase → SQL Editor → New query, paste this, press Run, then reload this page.")}</p>
              <pre className="max-h-48 overflow-auto rounded-xl border border-line bg-ink-2 p-3 text-xs whitespace-pre-wrap">{ES_SQL}</pre>
              <Btn kind="accent" onClick={() => navigator.clipboard.writeText(ES_SQL).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); })}>{copied ? "Copied ✓" : "Copy SQL"}</Btn>
            </div>
          )}
          {seeded && esState === "needsText" && (
            <div className="mb-6 space-y-3 rounded-2xl border border-accent/50 bg-accent/10 p-5">
              <p className="font-medium">{tx("Add Spanish to your starter content")}</p>
              <p className="text-sm text-cream/75">{tx("Visitors can switch the site to Spanish. Add ready-made Spanish for the starter services, portfolio, reviews and FAQ now; you can edit any of it afterwards.")}</p>
              <Btn kind="accent" onClick={seedSpanish}>Add Spanish translations</Btn>
            </div>
          )}
          {note && <div className="mb-6"><Notice kind={note.kind}>{note.text}</Notice></div>}
          {tab === "bookings" && <BookingsAdmin />}
          {tab === "calendar" && <CalendarAdmin />}
          {tab === "services" && (
            <Crud key="services" table="services" title="Services" blurb="Shown on the homepage → Menu tab and in booking. Price is the “from” price; duration controls how much calendar time it takes." fields={serviceFields} idMode="slug" titleKey="name"
              subtitle={(r) => `${r.category} · $${r.price} · ${r.minutes} min`} blank={{ name: "", category: "Color", blurb: "", price: 100, minutes: 60, deposit: 0, active: true }} />
          )}
          {tab === "addons" && (
            <Crud key="addons" table="addons" title="Add-ons" blurb="Shown on the Menu tab and offered during booking. Optional extras clients can add to a service." fields={addonFields} idMode="slug" titleKey="name"
              subtitle={(r) => `+$${r.price} · +${r.minutes} min`} blank={{ name: "", blurb: "", price: 30, minutes: 15, active: true }} />
          )}
          {tab === "team" && (
            <Crud key="team" table="team" title="Team" blurb="Your employees, shown in “Meet the team” underneath your own profile on the homepage (photo, name, role, bio). Until you add someone, that section is hidden." fields={teamFields} idMode="uuid" titleKey="name"
              subtitle={(r) => String(r.role)} blank={{ name: "", role: "", bio: "", photo_url: null, instagram: "", active: true }} setupSql={TEAM_SQL} />
          )}
          {tab === "products" && (
            <Crud key="products" table="products" title="Products" blurb="Shown on the Products page: eyelash extensions, shampoo, treatments and anything else you sell. Add a photo, price and description." fields={productFields} idMode="slug" titleKey="name"
              subtitle={(r) => `${r.category}${Number(r.price) ? ` · $${r.price}` : ""}${r.in_stock === false ? " · sold out" : ""}`} blank={{ name: "", category: "Hair care", blurb: "", price: 0, link: "", in_stock: true, image_url: null, active: true }} setupSql={PRODUCTS_SQL}
              starter={[
                { name: "Classic Lash Extensions", category: "Eyelash extensions", blurb: "Natural, wispy length for everyday wear.", price: 120, link: "", in_stock: true, image_url: null, es: {"name": "Extensiones de pestañas clásicas", "blurb": "Largo natural y ligero para todos los días."} },
                { name: "Volume Lash Extensions", category: "Eyelash extensions", blurb: "Fuller, fluffier lashes with a soft dramatic look.", price: 160, link: "", in_stock: true, image_url: null, es: {"name": "Extensiones de pestañas de volumen", "blurb": "Pestañas más llenas y esponjosas con un look suave y dramático."} },
                { name: "Lash Serum", category: "Eyelash extensions", blurb: "Nightly conditioning serum for stronger, longer-looking lashes.", price: 38, link: "", in_stock: true, image_url: null, es: {"name": "Sérum de pestañas", "blurb": "Sérum acondicionador nocturno para pestañas más fuertes y largas."} },
                { name: "Hydrating Shampoo", category: "Shampoo & conditioner", blurb: "Gentle, color-safe cleanse that keeps hair soft and shiny.", price: 28, link: "", in_stock: true, image_url: null, es: {"name": "Champú hidratante", "blurb": "Limpieza suave que protege el color y mantiene el cabello suave y brillante."} },
                { name: "Moisture Conditioner", category: "Shampoo & conditioner", blurb: "Silky conditioner for smooth, detangled hair.", price: 30, link: "", in_stock: true, image_url: null, es: {"name": "Acondicionador de humectación", "blurb": "Acondicionador sedoso para un cabello suave y sin enredos."} },
                { name: "Repair Hair Mask", category: "Treatments", blurb: "Weekly mask that restores strength and shine.", price: 34, link: "", in_stock: true, image_url: null, es: {"name": "Mascarilla reparadora", "blurb": "Mascarilla semanal que devuelve fuerza y brillo."} },
              ]} />
          )}
          {tab === "looks" && (
            <Crud key="looks" table="looks" title="Portfolio" blurb="Shown on the Portfolio page. Upload your best work (photos), and add a “before” photo to turn on the before/after slider." fields={lookFields} idMode="slug" titleKey="title"
              subtitle={(r) => String(r.category)} blank={{ title: "", category: "Color", kind: "straight", palette: ["#3a2418", "#b98a5e", "#f1dcc0"], service_id: "", story: "", hours: "", seed: 1, image_url: null, before_url: null, active: true }} />
          )}
          {tab === "reviews" && (
            <Crud key="reviews" table="reviews" title="Reviews" blurb="Shown on the homepage → Stories tab. Only add real reviews you have permission to share." fields={reviewFields} idMode="uuid" titleKey="name"
              subtitle={(r) => `${"★".repeat(Number(r.stars) || 0)} ${r.service}`} blank={{ name: "", service: "", quote: "", stars: 5, active: true }} />
          )}
          {tab === "faqs" && (
            <Crud key="faqs" table="faqs" title="FAQ" blurb="Shown on the homepage → Studio tab." fields={faqFields} idMode="uuid" titleKey="q" blank={{ q: "", a: "", active: true }} />
          )}
          {tab === "profile" && <SettingsAdmin key="profile" section="profile" />}
          {tab === "text" && <SettingsAdmin key="text" section="text" />}
          {tab === "settings" && <SettingsAdmin key="shop" section="shop" />}
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children, session }: { children: React.ReactNode; session?: Session | null }) {
  const tx = useTx();
  return (
    <div className="mx-auto min-h-dvh max-w-6xl px-4 py-6 sm:px-8">
      <header className="flex items-center justify-between border-b border-line pb-4">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-2xl">{tx("Dashboard")}</span>
          <a href="/" className="text-sm text-accent2 hover:underline" target="_blank" rel="noreferrer">{tx("View site ↗")}</a>
        </div>
        <div className="flex items-center gap-3">
          <LangToggle />
          <ThemeToggle />
          {session && <Btn small onClick={() => browserClient().auth.signOut()}>Sign out</Btn>}
        </div>
      </header>
      {children}
    </div>
  );
}
