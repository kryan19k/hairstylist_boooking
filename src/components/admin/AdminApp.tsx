"use client";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { browserClient, hasSupabase } from "@/lib/supabase";
import { revalidateSite } from "@/app/actions";
import { addons, categories, faqs, lookCategories, looks, reviews, services } from "@/lib/data";
import { defaultSettings, mergeSettings } from "@/lib/site";
import { Btn, Field, inputCls, Notice } from "./ui";
import Crud, { type FieldDef } from "./Crud";
import BookingsAdmin from "./BookingsAdmin";
import SettingsAdmin from "./SettingsAdmin";
import ThemeToggle from "../ThemeToggle";

type Gate = "loading" | "signed-out" | "checking" | "owner" | "unclaimed" | "denied" | "no-schema";
const tabs = [
  ["bookings", "Bookings"],
  ["services", "Services"],
  ["addons", "Add-ons"],
  ["team", "Team"],
  ["looks", "Portfolio"],
  ["reviews", "Reviews"],
  ["faqs", "FAQ"],
  ["settings", "Studio & site"],
] as const;
type Tab = (typeof tabs)[number][0];

const serviceFields: FieldDef[] = [
  { key: "name", label: "Service name", type: "text" },
  { key: "category", label: "Category", type: "select", options: [...categories] },
  { key: "blurb", label: "Description", type: "textarea" },
  { key: "price", label: "Starting price ($)", type: "number" },
  { key: "minutes", label: "Duration (minutes)", type: "number" },
  { key: "deposit", label: "Deposit ($)", type: "number", hint: "0 = no deposit" },
];
const addonFields: FieldDef[] = [
  { key: "name", label: "Name", type: "text" },
  { key: "blurb", label: "Short description", type: "text" },
  { key: "price", label: "Price ($)", type: "number" },
  { key: "minutes", label: "Adds (minutes)", type: "number" },
];
const lookFields: FieldDef[] = [
  { key: "image_url", label: "After photo (main image)", type: "image" },
  { key: "before_url", label: "Before photo (optional, enables the slider)", type: "image" },
  { key: "title", label: "Title", type: "text" },
  { key: "category", label: "Category", type: "select", options: lookCategories.filter((c) => c !== "All") },
  { key: "service_id", label: "Linked service id", type: "text", hint: "The “Book this look” button preselects this service. Copy an id from the Services tab URL list, e.g. blonde-balayage." },
  { key: "story", label: "Story", type: "textarea" },
  { key: "hours", label: "Time in chair (label)", type: "text", hint: "e.g. 3.5 hrs" },
  { key: "kind", label: "Placeholder art style", type: "select", options: ["straight", "wave", "curl", "bob"], hint: "Only used when no photo is uploaded." },
  { key: "palette", label: "Palette (placeholder art)", type: "palette" },
];
const teamFields: FieldDef[] = [
  { key: "photo_url", label: "Photo", type: "image" },
  { key: "name", label: "Name", type: "text" },
  { key: "role", label: "Role", type: "text", hint: "e.g. Color specialist" },
  { key: "bio", label: "Short bio", type: "textarea" },
  { key: "instagram", label: "Instagram handle", type: "text", hint: "without the @" },
];
const reviewFields: FieldDef[] = [
  { key: "name", label: "Client name", type: "text" },
  { key: "service", label: "Service they had", type: "text" },
  { key: "quote", label: "Review", type: "textarea" },
  { key: "stars", label: "Stars (1–5)", type: "number" },
];
const faqFields: FieldDef[] = [
  { key: "q", label: "Question", type: "text", wide: true },
  { key: "a", label: "Answer", type: "textarea" },
];

function Login() {
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
        <p className="text-xs tracking-[0.3em] text-accent uppercase">Owner login</p>
        <h1 className="font-display mt-2 text-4xl font-light">Welcome back</h1>
      </div>
      <Field label="Email"><input className={inputCls} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
      <Field label="Password"><input className={inputCls} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></Field>
      {err && <Notice kind="error">{err}</Notice>}
      <Btn type="submit" kind="accent" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Btn>
    </form>
  );
}

export default function AdminApp() {
  const [gate, setGate] = useState<Gate>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [tab, setTab] = useState<Tab>("bookings");
  const [seeded, setSeeded] = useState(true);
  const [note, setNote] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const check = async () => {
    const db = browserClient();
    const { data, error } = await db.rpc("is_admin");
    if (error) return setGate("no-schema");
    if (data === true) {
      const st = await db.from("site_settings").select("data").eq("id", 1).maybeSingle();
      setSeeded(mergeSettings(st.data?.data).seeded);
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

  const seed = async () => {
    if (!window.confirm("Load the starter services, portfolio, reviews and FAQ into your database? You can edit or delete everything afterwards.")) return;
    const db = browserClient();
    const results = await Promise.all([
      db.from("services").upsert(services.map((s, i) => ({ id: s.id, name: s.name, category: s.category, blurb: s.blurb, price: s.price, minutes: s.minutes, deposit: s.deposit, sort: i + 1, active: true }))),
      db.from("addons").upsert(addons.map((a, i) => ({ ...a, sort: i + 1, active: true }))),
      db.from("looks").upsert(looks.map((l, i) => ({ id: l.id, title: l.title, category: l.category, kind: l.kind, palette: l.palette, service_id: l.serviceId, story: l.story, hours: l.hours, seed: l.seed, image_url: null, before_url: null, sort: i + 1, active: true }))),
      db.from("reviews").insert(reviews.map((r, i) => ({ ...r, sort: i + 1, active: true }))),
      db.from("faqs").insert(faqs.map((f, i) => ({ ...f, sort: i + 1, active: true }))),
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
  if (gate === "loading" || gate === "checking") return <Shell><p className="mt-24 text-center text-muted">Loading…</p></Shell>;
  if (gate === "signed-out") return <Shell><Login /></Shell>;
  if (gate === "no-schema")
    return (
      <Shell session={session}>
        <div className="mx-auto mt-16 max-w-xl space-y-4">
          <h1 className="font-display text-4xl font-light">One-time database setup</h1>
          <Notice kind="info">
            Open your Supabase project → <b>SQL Editor</b> → New query, paste the contents of <code>supabase/schema.sql</code> from this project, and press <b>Run</b>. Then reload this page.
          </Notice>
        </div>
      </Shell>
    );
  if (gate === "unclaimed" || gate === "denied")
    return (
      <Shell session={session}>
        <div className="mx-auto mt-16 max-w-xl space-y-4">
          <h1 className="font-display text-4xl font-light">{gate === "denied" ? "Not authorized" : "Claim this website"}</h1>
          {gate === "denied" ? (
            <Notice kind="error">This account isn’t the owner of this site. Sign out and use the owner login.</Notice>
          ) : (
            <>
              <p className="text-cream/75">No owner has been set up yet. If you’re the salon owner, claim the dashboard now. This can only be done once.</p>
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
        <nav aria-label="Dashboard sections" className="scroll-hide flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {tabs.map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} aria-current={tab === id} className={`shrink-0 rounded-xl px-4 py-2.5 text-left text-sm transition ${tab === id ? "bg-accent/15 font-semibold text-accent2" : "text-cream/75 hover:bg-ink-3"}`}>
              {label}
            </button>
          ))}
        </nav>
        <div className="min-w-0 pb-24">
          {!seeded && (
            <div className="mb-6 space-y-3 rounded-2xl border border-accent/50 bg-accent/10 p-5">
              <p className="font-medium">Your website is showing sample content.</p>
              <p className="text-sm text-cream/75">Load the starter services, portfolio, reviews and FAQ into your database so you can edit them here.</p>
              <Btn kind="accent" onClick={seed}>Load starter content</Btn>
            </div>
          )}
          {note && <div className="mb-6"><Notice kind={note.kind}>{note.text}</Notice></div>}
          {tab === "bookings" && <BookingsAdmin />}
          {tab === "services" && (
            <Crud key="services" table="services" title="Services" blurb="What clients can book. Price is the “from” price; duration controls how much calendar time it takes." fields={serviceFields} idMode="slug" titleKey="name"
              subtitle={(r) => `${r.category} · $${r.price} · ${r.minutes} min`} blank={{ name: "", category: "Color", blurb: "", price: 100, minutes: 60, deposit: 0, active: true }} />
          )}
          {tab === "addons" && (
            <Crud key="addons" table="addons" title="Add-ons" blurb="Optional extras clients can tack onto a service." fields={addonFields} idMode="slug" titleKey="name"
              subtitle={(r) => `+$${r.price} · +${r.minutes} min`} blank={{ name: "", blurb: "", price: 30, minutes: 15, active: true }} />
          )}
          {tab === "team" && (
            <Crud key="team" table="team" title="Team" blurb="People shown in “Meet the team” under the homepage banner. If this is empty, the owner card is shown automatically." fields={teamFields} idMode="uuid" titleKey="name"
              subtitle={(r) => String(r.role)} blank={{ name: "", role: "", bio: "", photo_url: null, instagram: "", active: true }} />
          )}
          {tab === "looks" && (
            <Crud key="looks" table="looks" title="Portfolio" blurb="Upload your best work. Add a “before” photo to turn on the before/after slider." fields={lookFields} idMode="slug" titleKey="title"
              subtitle={(r) => String(r.category)} blank={{ title: "", category: "Color", kind: "straight", palette: ["#3a2418", "#b98a5e", "#f1dcc0"], service_id: "", story: "", hours: "", seed: 1, image_url: null, before_url: null, active: true }} />
          )}
          {tab === "reviews" && (
            <Crud key="reviews" table="reviews" title="Reviews" blurb="Client words on the Stories tab. Only add real reviews you have permission to share." fields={reviewFields} idMode="uuid" titleKey="name"
              subtitle={(r) => `${"★".repeat(Number(r.stars) || 0)} ${r.service}`} blank={{ name: "", service: "", quote: "", stars: 5, active: true }} />
          )}
          {tab === "faqs" && (
            <Crud key="faqs" table="faqs" title="FAQ" blurb="Questions shown on the Studio tab." fields={faqFields} idMode="uuid" titleKey="q" blank={{ q: "", a: "", active: true }} />
          )}
          {tab === "settings" && <SettingsAdmin />}
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children, session }: { children: React.ReactNode; session?: Session | null }) {
  return (
    <div className="mx-auto min-h-dvh max-w-6xl px-4 py-6 sm:px-8">
      <header className="flex items-center justify-between border-b border-line pb-4">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-2xl">Dashboard</span>
          <a href="/" className="text-sm text-accent2 hover:underline" target="_blank" rel="noreferrer">View site ↗</a>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {session && <Btn small onClick={() => browserClient().auth.signOut()}>Sign out</Btn>}
        </div>
      </header>
      {children}
    </div>
  );
}
