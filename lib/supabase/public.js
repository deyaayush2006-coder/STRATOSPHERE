import { createClient } from "@supabase/supabase-js";

/* The client the public site reads through.
 *
 * Deliberately not the cookie-aware one: nothing on the public pages depends
 * on who is looking, and touching cookies() would opt every page into dynamic
 * rendering. This stays a plain anon client so the home page can be built once
 * and revalidated on a timer.
 *
 * The anon key is safe in the browser bundle and in a public repo — row level
 * security is what actually decides what it can see, and it can only read the
 * rows marked published.
 */
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(URL && ANON_KEY);

/* Null rather than a client built on undefined values.
 *
 * supabase-js throws on construction if the URL is missing, which would take
 * the whole site down at build time over an unset variable. The reader checks
 * for null and serves the bundled content instead, so `npm run build` works
 * before Supabase exists and a half-configured deploy still shows the club
 * site rather than a stack trace. */
export const supabasePublic = isSupabaseConfigured
  ? createClient(URL, ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

export { mediaUrl } from "../media-url";
