import "server-only";
import { createClient } from "@supabase/supabase-js";

/* Service-role client. Bypasses row level security completely, so it is used
   for exactly one thing the anon key cannot do: creating and deleting the
   auth users behind committee accounts.
 *
 * Never import this from a client component. SUPABASE_SERVICE_ROLE_KEY has no
 * NEXT_PUBLIC_ prefix, so a stray import fails the build rather than shipping
 * the key to the browser.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Account management needs it — " +
        "copy it from Supabase → Project Settings → API into .env.local and Vercel."
    );
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
