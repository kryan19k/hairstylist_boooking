import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const hasSupabase = Boolean(url && key);

/** Server-side anonymous client (public reads + visitor booking inserts). */
export function serverClient(): SupabaseClient {
  return createClient(url!, key!, { auth: { persistSession: false, autoRefreshToken: false } });
}

let browser: SupabaseClient | null = null;
/** Browser client — keeps the owner's session in localStorage for /admin. */
export function browserClient(): SupabaseClient {
  return (browser ??= createClient(url!, key!));
}

export const MEDIA_BUCKET = "site-media";
