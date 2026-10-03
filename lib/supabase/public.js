import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(URL && ANON_KEY);

export const supabasePublic = isSupabaseConfigured
  ? createClient(URL, ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

export { mediaUrl } from "../media-url";
