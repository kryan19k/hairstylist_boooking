"use client";
import { useRef, useState } from "react";
import { browserClient, MEDIA_BUCKET } from "@/lib/supabase";

export const inputCls =
  "w-full rounded-xl border border-line bg-ink-2 px-3.5 py-2.5 text-sm text-cream placeholder:text-cream/35 transition focus:border-accent";

export function Field({ label, hint, children, className = "" }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[0.68rem] tracking-[0.2em] text-muted uppercase">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function Btn({
  children, onClick, kind = "ghost", disabled, type = "button", small,
}: { children: React.ReactNode; onClick?: () => void; kind?: "accent" | "ghost" | "danger"; disabled?: boolean; type?: "button" | "submit"; small?: boolean }) {
  const base = small ? "rounded-full px-4 py-2 text-xs" : "rounded-full px-6 py-3 text-sm";
  const k = kind === "accent" ? "btn-accent" : kind === "danger" ? "border border-[#d9534f]/50 text-[#d9534f] hover:bg-[#d9534f]/10 transition" : "btn-ghost";
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${k} disabled:pointer-events-none disabled:opacity-40`}>
      {children}
    </button>
  );
}

export function Notice({ kind, children }: { kind: "error" | "ok" | "info"; children: React.ReactNode }) {
  const c = kind === "error" ? "border-[#d9534f]/50 bg-[#d9534f]/10 text-[#c0443f]" : kind === "ok" ? "border-counter/50 bg-counter/10 text-counter" : "border-line bg-ink-3/50 text-cream/80";
  return <div role={kind === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm ${c}`}>{children}</div>;
}

/** Upload to the public `site-media` bucket and return the public URL. */
export function ImageField({ value, onChange, label = "Photo" }: { value: string | null; onChange: (url: string | null) => void; label?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const upload = async (file: File) => {
    setErr("");
    if (!file.type.startsWith("image/")) return setErr("Please choose an image file.");
    if (file.size > 8 * 1024 * 1024) return setErr("Image is over 8 MB. Please choose a smaller one.");
    setBusy(true);
    const db = browserClient();
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await db.storage.from(MEDIA_BUCKET).upload(path, file, { cacheControl: "31536000", contentType: file.type });
    setBusy(false);
    if (error) return setErr(error.message);
    onChange(db.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl);
  };

  return (
    <div>
      <span className="mb-1.5 block text-[0.68rem] tracking-[0.2em] text-muted uppercase">{label}</span>
      <div className="flex items-center gap-3">
        <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-ink-3 text-xs text-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {value ? <img src={value} alt="" className="size-full object-cover" /> : "No photo"}
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn small onClick={() => ref.current?.click()} disabled={busy}>{busy ? "Uploading…" : value ? "Replace" : "Upload"}</Btn>
          {value && <Btn small kind="danger" onClick={() => onChange(null)}>Remove</Btn>}
        </div>
        <input ref={ref} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
      </div>
      {err && <p className="mt-1 text-xs text-[#c0443f]">{err}</p>}
    </div>
  );
}
